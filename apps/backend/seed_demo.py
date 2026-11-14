"""Add the demo catalog to SQLite without overwriting existing content.

Called automatically when the backend starts. You can also run it manually:
.venv/Scripts/python.exe apps/backend/seed_demo.py
The starter concepts are included so this also works with an empty database.
"""

import json
from contextlib import closing
from pathlib import Path

from db import DB_PATH, get_conn, init_db
from models import RoadmapEdge, RoadmapNode
from seed import CONCEPTS, PREREQUISITES

DEMO_PATH = Path(__file__).with_name("demo_data.json")


def load_demo() -> tuple[list[tuple], list[tuple]]:
    data = json.loads(DEMO_PATH.read_text(encoding="utf-8"))
    nodes = [RoadmapNode.model_validate(node) for node in data["concepts"]]
    links = [RoadmapEdge.model_validate(edge) for edge in data["edges"]]
    concepts = list(CONCEPTS) + [
        (node.id, node.label, node.description, node.category, node.difficulty)
        for node in nodes
    ]
    edges = list(PREREQUISITES) + [
        (edge.to, edge.from_, edge.type) for edge in links
    ]

    # Validate references and cycles before making any database changes.
    ids = {row[0] for row in concepts}
    if len(ids) != len(concepts) or "" in ids:
        raise ValueError("Demo concept IDs must be nonempty and unique.")
    dependencies = {concept_id: [] for concept_id in ids}
    pairs = set()
    for concept_id, requires_id, _ in edges:
        if concept_id not in ids or requires_id not in ids:
            raise ValueError(f"Unknown concept in edge: {requires_id} -> {concept_id}")
        pair = (concept_id, requires_id)
        if pair in pairs:
            raise ValueError(f"Duplicate prerequisite: {pair}")
        pairs.add(pair)
        dependencies[concept_id].append(requires_id)

    visiting, visited = set(), set()

    def visit(concept_id: str) -> None:
        if concept_id in visiting:
            raise ValueError(f"Prerequisite cycle at {concept_id}")
        if concept_id in visited:
            return
        visiting.add(concept_id)
        for prerequisite in dependencies[concept_id]:
            visit(prerequisite)
        visiting.remove(concept_id)
        visited.add(concept_id)

    for concept_id in ids:
        visit(concept_id)
    return concepts, edges


def seed_demo() -> None:
    concepts, edges = load_demo()
    init_db()
    with closing(get_conn()) as conn, conn:
        # One transaction keeps each new concept and its prerequisites together.
        conn.execute("BEGIN IMMEDIATE")
        existing = {row[0] for row in conn.execute("SELECT id FROM concepts")}
        new_concepts = [row for row in concepts if row[0] not in existing]
        new_ids = {row[0] for row in new_concepts}
        # Preserve prerequisite edits to any concept already in the database.
        new_edges = [row for row in edges if row[0] in new_ids]
        conn.executemany(
            "INSERT INTO concepts (id, label, description, category, difficulty) "
            "VALUES (?, ?, ?, ?, ?)",
            new_concepts,
        )
        conn.executemany(
            "INSERT INTO prerequisites (concept_id, requires_id, type) VALUES (?, ?, ?)",
            new_edges,
        )
        total_concepts = conn.execute("SELECT COUNT(*) FROM concepts").fetchone()[0]
        total_edges = conn.execute("SELECT COUNT(*) FROM prerequisites").fetchone()[0]
        total_topics = conn.execute(
            "SELECT COUNT(*) FROM concepts WHERE category = 'domain'"
        ).fetchone()[0]
    print(f"Database: {DB_PATH}")
    print(f"Added {len(new_concepts)} concepts and {len(new_edges)} prerequisites.")
    print(f"Total: {total_concepts} concepts, {total_edges} prerequisites, {total_topics} topics.")


if __name__ == "__main__":
    seed_demo()
