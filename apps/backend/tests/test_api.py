import pytest
from fastapi.testclient import TestClient

import db
import main
from tests.conftest import make_roadmap


def test_health(client):
    assert client.get("/api/health").json() == {"ok": True}


def test_root_lists_routes(client):
    body = client.get("/").json()
    assert "/api/roadmap/{topic}" in body["routes"]


def test_topics_empty(client):
    assert client.get("/api/topics").json() == []


def test_topics_returns_saved_goals(client):
    db.save_roadmap(make_roadmap())
    assert client.get("/api/topics").json() == [{"id": "ml", "label": "Machine Learning"}]


def test_roadmap_matches_api_contract(client):
    db.save_roadmap(make_roadmap())
    response = client.get("/api/roadmap/ml")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"goal", "nodes", "edges"}
    assert body["goal"] == "ml"
    assert set(body["nodes"][0]) == {"id", "label", "category", "difficulty", "description"}
    # The wire format uses "from", not the Python-side "from_".
    assert set(body["edges"][0]) == {"from", "to", "type"}
    assert {"from": "python", "to": "ml", "type": "required"} in body["edges"]


def test_roadmap_unknown_topic_is_404(client):
    response = client.get("/api/roadmap/does-not-exist")
    assert response.status_code == 404
    assert response.json() == {"detail": "Roadmap not found"}


def test_cors_allows_frontend_origin(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_other_origins(client):
    response = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in response.headers


# --- Docker mode: the same server also delivers the built frontend ---

@pytest.fixture
def spa_client(tmp_path):
    from fastapi import FastAPI

    (tmp_path / "index.html").write_text("<html>app</html>", encoding="utf-8")
    (tmp_path / "favicon.svg").write_text("<svg/>", encoding="utf-8")
    spa = FastAPI()
    spa.mount("/", main.SPAStaticFiles(directory=tmp_path, html=True))
    return TestClient(spa)


def test_frontend_files_are_served(spa_client):
    assert spa_client.get("/").text == "<html>app</html>"
    assert spa_client.get("/favicon.svg").text == "<svg/>"


def test_frontend_routes_fall_back_to_index(spa_client):
    # /graph is a React Router page, not a file: the browser must get the app.
    response = spa_client.get("/graph")
    assert response.status_code == 200
    assert response.text == "<html>app</html>"


def test_unknown_api_route_stays_404(spa_client):
    assert spa_client.get("/api/nope").status_code == 404
