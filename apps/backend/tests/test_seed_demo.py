"""Regression checks for automatic seeding against the current SQLite schema."""

import db
from models import Roadmap
from seed_demo import seed_demo


def snapshot():
    with db.get_conn() as conn:
        return {
            'concepts': [tuple(row) for row in conn.execute('SELECT * FROM concepts ORDER BY id')],
            'prerequisites': [tuple(row) for row in conn.execute('SELECT * FROM prerequisites ORDER BY concept_id, requires_id')],
            'topics': [tuple(row) for row in conn.execute('SELECT * FROM topics ORDER BY id')],
        }


def test_demo_seed_exposes_all_topics_and_valid_roadmaps(database):
    seed_demo()
    state = snapshot()
    assert len(state['concepts']) == 131
    assert len(state['prerequisites']) == 180
    topics = db.list_topics()
    assert len(topics) == 12
    assert {'machine-learning', 'demo-game', 'demo-music'} <= {topic.id for topic in topics}
    for topic in topics:
        assert Roadmap.model_validate(db.get_roadmap(topic.id)).goal == topic.id


def test_demo_reseed_preserves_user_data_and_prerequisite_edits(database):
    seed_demo()
    with db.get_conn() as conn:
        conn.execute("UPDATE concepts SET label = 'Custom Python' WHERE id = 'python'")
        conn.execute("DELETE FROM prerequisites WHERE concept_id = 'demo-game-engine'")
        conn.execute("INSERT INTO concepts VALUES ('custom', 'My Step', 'Custom', 'tools', 2)")
        conn.execute("INSERT INTO topics VALUES ('custom')")
    before = snapshot()
    seed_demo()
    assert snapshot() == before


def test_demo_seed_registers_topics_when_concepts_already_exist(database):
    seed_demo()
    before = snapshot()
    with db.get_conn() as conn:
        conn.execute('DELETE FROM topics')
    assert db.list_topics() == []
    seed_demo()
    assert snapshot() == before
