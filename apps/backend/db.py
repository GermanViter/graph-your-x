"""Connexion SQLite et requêtes."""

import sqlite3
from contextlib import closing
from pathlib import Path

from models import Roadmap, RoadmapEdge, RoadmapNode, Topic

DB_PATH = Path(__file__).parent / "data.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('math', 'programming', 'theory', 'tools', 'domain')),
    difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS prerequisites (
    concept_id TEXT NOT NULL REFERENCES concepts(id),
    requires_id TEXT NOT NULL REFERENCES concepts(id),
    type TEXT NOT NULL CHECK (type IN ('required', 'recommended')),
    PRIMARY KEY (concept_id, requires_id)
);
"""

# Tous les concepts atteignables depuis le but, en remontant les préalables.
ROADMAP_NODES_CTE = """
WITH RECURSIVE roadmap_nodes(id) AS (
    SELECT ?
    UNION
    SELECT p.requires_id
    FROM prerequisites p

    JOIN roadmap_nodes r ON p.concept_id = r.id
)
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with closing(get_conn()) as conn:
        conn.executescript(SCHEMA)
        conn.commit()


def list_topics() -> list[Topic]:
    with closing(get_conn()) as conn:
        rows = conn.execute(
            "SELECT id, label FROM concepts WHERE category = ? ORDER BY label",
            ("domain",),
        ).fetchall()
    return [Topic(**dict(r)) for r in rows]


def get_roadmap(goal_id: str) -> Roadmap | None:
    with closing(get_conn()) as conn:
        goal = conn.execute("SELECT id FROM concepts WHERE id = ?", (goal_id,)).fetchone()
        if goal is None:
            return None

        node_rows = conn.execute(
            ROADMAP_NODES_CTE
            + """
            SELECT c.id, c.label, c.description, c.category, c.difficulty
            FROM concepts c
            JOIN roadmap_nodes r ON c.id = r.id
            """,
            (goal_id,),
        ).fetchall()

        edge_rows = conn.execute(
            ROADMAP_NODES_CTE
            + """
            SELECT p.requires_id AS "from", p.concept_id AS "to", p.type
            FROM prerequisites p
            JOIN roadmap_nodes a ON p.concept_id = a.id
            JOIN roadmap_nodes b ON p.requires_id = b.id
            """,
            (goal_id,),
        ).fetchall()

<<<<<<< HEAD
    return Roadmap(
        goal=goal_id,
        nodes=[RoadmapNode(**dict(r)) for r in node_rows],
        edges=[RoadmapEdge(**dict(r)) for r in edge_rows],
    )
=======
    return {
        "goal": goal_id,
        "nodes": [dict(n) for n in nodes],
        # DB (concept_id needs requires_id) -> API (from prerequisite, to dependent)
        "edges": [
            {"from": e["requires_id"], "to": e["concept_id"], "type": e["type"]}
            for e in edges
        ],
    }


def list_concepts() -> list[dict]:
    """All concept ids and labels, passed to the LLM so it reuses existing ids."""
    with get_conn() as conn:
        rows = conn.execute("SELECT id, label FROM concepts ORDER BY id").fetchall()
    return [dict(r) for r in rows]


def list_topics() -> list[dict]:
    """The goal courses for the UI picker: [{"id": ..., "label": ...}]."""
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT c.id, c.label
            FROM topics t
            JOIN concepts c ON c.id = t.id
            ORDER BY c.label
            """
        ).fetchall()
    return [dict(r) for r in rows]


def save_roadmap(roadmap: dict) -> None:
    """Save a VALIDATED roadmap (API shape). All-or-nothing; safe to call twice.

    Existing concepts are kept as they are, so hand-checked seed data wins over
    whatever the LLM wrote for the same id.
    """
    with get_conn() as conn:
        conn.executemany(
            """
            INSERT INTO concepts (id, label, description, category, difficulty)
            VALUES (:id, :label, :description, :category, :difficulty)
            ON CONFLICT (id) DO NOTHING
            """,
            roadmap["nodes"],
        )
        conn.executemany(
            """
            INSERT INTO prerequisites (concept_id, requires_id, type)
            VALUES (?, ?, ?)
            ON CONFLICT (concept_id, requires_id) DO NOTHING
            """,
            # API (from prerequisite, to dependent) -> DB (concept_id, requires_id)
            [(e["to"], e["from"], e["type"]) for e in roadmap["edges"]],
        )
        conn.execute(
            "INSERT INTO topics (id) VALUES (?) ON CONFLICT (id) DO NOTHING",
            (roadmap["goal"],),
        )
>>>>>>> 69553a8 (list_topics)
