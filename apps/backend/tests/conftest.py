"""Shared fixtures. Tests never touch the real app.db: db.DB_PATH points to a temp file."""

import tempfile
from pathlib import Path

import pytest

import db

# main.py calls db.init_db() when imported, so redirect the DB *before* importing it.
_IMPORT_TIME_DB = Path(tempfile.mkdtemp()) / "import.db"
db.DB_PATH = _IMPORT_TIME_DB

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from models import Roadmap  # noqa: E402


def make_roadmap(goal: str = "ml", nodes: list[dict] | None = None, edges: list[dict] | None = None) -> Roadmap:
    if nodes is None:
        nodes = [
            {"id": "python", "label": "Python", "description": "A language.", "category": "programming", "difficulty": 1},
            {"id": "algebra", "label": "Linear Algebra", "description": "Vectors.", "category": "math", "difficulty": 3},
            {"id": "ml", "label": "Machine Learning", "description": "Learn from data.", "category": "domain", "difficulty": 4},
        ]
    if edges is None:
        edges = [
            {"from": "python", "to": "ml", "type": "required"},
            {"from": "algebra", "to": "ml", "type": "recommended"},
        ]
    return Roadmap.model_validate({"goal": goal, "nodes": nodes, "edges": edges})


@pytest.fixture
def database(tmp_path, monkeypatch):
    """A fresh, empty, initialised database for one test."""
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "test.db")
    db.init_db()
    return db


@pytest.fixture
def client(database) -> TestClient:
    return TestClient(main.app)
