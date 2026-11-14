"""SQLite connection and queries.

All SQL lives here. Route handlers in main.py call these functions and never
write SQL themselves. Only standard SQL is used, so switching to PostgreSQL later
means changing get_conn() and the placeholders (? -> %s).
"""

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

# app.db sits next to this file, no matter which folder you run from.
DB_PATH = Path(__file__).parent / "app.db"


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    """Open a new connection: commit on success, roll back on error, always close.

    Usage:
        with get_conn() as conn:
            conn.execute("...", (value,))
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row            # rows behave like dicts: row["id"]
    conn.execute("PRAGMA foreign_keys = ON")  # SQLite ignores REFERENCES without this
    try:
        with conn:                            # transaction: commit or rollback
            yield conn
    finally:
        conn.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS concepts (
    id          TEXT PRIMARY KEY,                 -- 'programmation-orientee-objet'
    label       TEXT NOT NULL,                    -- 'Programmation orientée-objet'
    description TEXT,
    category    TEXT NOT NULL
                CHECK (category IN ('math', 'programming', 'theory', 'tools', 'domain')),
    difficulty  INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5)
);

-- A row (concept_id, requires_id) means: requires_id comes before concept_id.
CREATE TABLE IF NOT EXISTS prerequisites (
    concept_id  TEXT NOT NULL REFERENCES concepts(id),
    requires_id TEXT NOT NULL REFERENCES concepts(id),
    type        TEXT NOT NULL
                CHECK (type IN ('required', 'recommended', 'corequisite')),
    PRIMARY KEY (concept_id, requires_id)         -- no duplicate edges
);

-- The goal courses shown in the UI course picker.
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY REFERENCES concepts(id)
);
"""


def init_db() -> None:
    """Create the tables if they don't exist yet. Safe to call many times."""
    with get_conn() as conn:
        conn.executescript(SCHEMA)


# Every concept reachable from the goal by following prerequisites downward.
# UNION (not UNION ALL) drops ids already seen, so the walk always stops,
# even if corequisite edges form a loop.
CHAIN_CTE = """
WITH RECURSIVE chain(id) AS (
    SELECT ?
    UNION
    SELECT p.requires_id
    FROM prerequisites p
    JOIN chain c ON p.concept_id = c.id
)
"""


def get_roadmap(goal_id: str) -> dict | None:
    """Return the roadmap for goal_id in the API shape, or None if it isn't in the DB."""
    with get_conn() as conn:
        exists = conn.execute("SELECT 1 FROM concepts WHERE id = ?", (goal_id,)).fetchone()
        if exists is None:
            return None

        nodes = conn.execute(
            CHAIN_CTE
            + """
            SELECT id, label, category, difficulty, description
            FROM concepts
            WHERE id IN (SELECT id FROM chain)
            ORDER BY difficulty, id
            """,
            (goal_id,),
        ).fetchall()

        edges = conn.execute(
            CHAIN_CTE
            + """
            SELECT requires_id, concept_id, type
            FROM prerequisites
            WHERE concept_id IN (SELECT id FROM chain)
            """,
            (goal_id,),
        ).fetchall()

    return {
        "goal": goal_id,
        "nodes": [dict(n) for n in nodes],
        # DB (concept_id needs requires_id) -> API (from prerequisite, to dependent)
        "edges": [
            {"from": e["requires_id"], "to": e["concept_id"], "type": e["type"]}
            for e in edges
        ],
    }
