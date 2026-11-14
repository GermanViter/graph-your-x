"""API FastAPI : routes et CORS."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import db
from models import Roadmap, Topic
from seed_demo import seed_demo

# Fill missing starter and demo entries before the API accepts requests.
seed_demo()

app = FastAPI(title="graph-your-x API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, object]:
    return {
        "name": "graph-your-x API",
        "docs": "/docs",
        "routes": ["/api/health", "/api/topics", "/api/roadmap/{topic}"],
    }


@app.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/api/topics", response_model=list[Topic])
def topics() -> list[Topic]:
    return db.list_topics()


@app.get("/api/roadmap/{topic}", response_model=Roadmap)
def roadmap(topic: str) -> Roadmap:
    result = db.get_roadmap(topic)
    if result is None:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return result
