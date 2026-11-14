import sqlite3

import pytest

import db
from tests.conftest import make_roadmap


def test_init_db_is_idempotent(database):
    database.init_db()
    database.init_db()
    with db.get_conn() as conn:
        tables = {r["name"] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert {"concepts", "prerequisites", "topics"} <= tables


def test_get_roadmap_unknown_goal_returns_none(database):
    assert db.get_roadmap("nope") is None


def test_save_then_get_roadmap_round_trips_api_shape(database):
    db.save_roadmap(make_roadmap())
    result = db.get_roadmap("ml")

    assert result["goal"] == "ml"
    assert {n["id"] for n in result["nodes"]} == {"python", "algebra", "ml"}
    # Edge direction: "from" is the prerequisite, "to" depends on it.
    assert {(e["from"], e["to"], e["type"]) for e in result["edges"]} == {
        ("python", "ml", "required"),
        ("algebra", "ml", "recommended"),
    }
    assert set(result["nodes"][0]) == {"id", "label", "category", "difficulty", "description"}


def test_get_roadmap_nodes_ordered_by_difficulty_then_id(database):
    db.save_roadmap(make_roadmap())
    assert [n["id"] for n in db.get_roadmap("ml")["nodes"]] == ["python", "algebra", "ml"]


def test_get_roadmap_only_includes_the_goals_chain(database):
    db.save_roadmap(make_roadmap())
    db.save_roadmap(make_roadmap(
        goal="web",
        nodes=[
            {"id": "html", "label": "HTML", "description": "Markup.", "category": "programming", "difficulty": 1},
            {"id": "web", "label": "Web", "description": "The web.", "category": "domain", "difficulty": 2},
        ],
        edges=[{"from": "html", "to": "web", "type": "required"}],
    ))
    assert {n["id"] for n in db.get_roadmap("web")["nodes"]} == {"html", "web"}
    assert "html" not in {n["id"] for n in db.get_roadmap("ml")["nodes"]}


def test_get_roadmap_follows_transitive_prerequisites(database):
    chain = [("a", 1), ("b", 2), ("c", 3)]
    db.save_roadmap(make_roadmap(
        goal="c",
        nodes=[{"id": i, "label": i, "description": "d", "category": "math", "difficulty": d} for i, d in chain],
        edges=[{"from": "a", "to": "b", "type": "required"}, {"from": "b", "to": "c", "type": "required"}],
    ))
    assert {n["id"] for n in db.get_roadmap("c")["nodes"]} == {"a", "b", "c"}
    assert {n["id"] for n in db.get_roadmap("b")["nodes"]} == {"a", "b"}


def test_get_roadmap_terminates_on_cyclic_data(database):
    with db.get_conn() as conn:
        conn.executemany(
            "INSERT INTO concepts VALUES (?, ?, ?, 'math', 1)", [("x", "X", "d"), ("y", "Y", "d")]
        )
        conn.executemany(
            "INSERT INTO prerequisites VALUES (?, ?, 'required')", [("x", "y"), ("y", "x")]
        )
    assert {n["id"] for n in db.get_roadmap("x")["nodes"]} == {"x", "y"}


def test_save_roadmap_is_idempotent(database):
    db.save_roadmap(make_roadmap())
    db.save_roadmap(make_roadmap())
    result = db.get_roadmap("ml")
    assert len(result["nodes"]) == 3
    assert len(result["edges"]) == 2
    assert len(db.list_topics()) == 1


def test_save_roadmap_keeps_existing_concept_data(database):
    db.save_roadmap(make_roadmap())
    changed = make_roadmap(nodes=[
        {"id": "python", "label": "LLM Python", "description": "x", "category": "tools", "difficulty": 5},
        {"id": "algebra", "label": "Linear Algebra", "description": "Vectors.", "category": "math", "difficulty": 3},
        {"id": "ml", "label": "Machine Learning", "description": "Learn from data.", "category": "domain", "difficulty": 4},
    ])
    db.save_roadmap(changed)
    python = next(n for n in db.get_roadmap("ml")["nodes"] if n["id"] == "python")
    assert python["label"] == "Python"
    assert python["difficulty"] == 1


def test_list_topics_only_returns_saved_goals_sorted_by_label(database):
    db.save_roadmap(make_roadmap())
    db.save_roadmap(make_roadmap(
        goal="art",
        nodes=[{"id": "art", "label": "Art", "description": "d", "category": "theory", "difficulty": 1}],
        edges=[],
    ))
    assert [(t.id, t.label) for t in db.list_topics()] == [("art", "Art"), ("ml", "Machine Learning")]


def test_list_concepts_returns_all_sorted_by_id(database):
    db.save_roadmap(make_roadmap())
    assert [c.id for c in db.list_concepts()] == ["algebra", "ml", "python"]


@pytest.mark.parametrize(
    "sql",
    [
        "INSERT INTO concepts VALUES ('bad', 'Bad', 'd', 'cooking', 1)",  # category
        "INSERT INTO concepts VALUES ('bad', 'Bad', 'd', 'math', 6)",  # difficulty
        "INSERT INTO prerequisites VALUES ('ghost', 'phantom', 'required')",  # foreign key
    ],
)
def test_schema_rejects_invalid_rows(database, sql):
    with pytest.raises(sqlite3.IntegrityError):
        with db.get_conn() as conn:
            conn.execute(sql)


def test_get_conn_rolls_back_on_error(database):
    with pytest.raises(RuntimeError):
        with db.get_conn() as conn:
            conn.execute("INSERT INTO concepts VALUES ('z', 'Z', 'd', 'math', 1)")
            raise RuntimeError
    assert db.list_concepts() == []
