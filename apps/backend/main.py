"""API FastAPI : routes et CORS."""

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response
from starlette.types import Scope

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


# Folder holding the built frontend (apps/frontend/dist). Only set in the Docker
# image, where this one server delivers both the API and the web app.
FRONTEND_DIST = os.environ.get("FRONTEND_DIST")


class SPAStaticFiles(StaticFiles):
    """Serve the built frontend; unknown paths get index.html so React Router works."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            # Unknown API routes stay real 404s instead of returning the web page.
            if error.status_code != 404 or path == "api" or path.startswith("api/"):
                raise
            return await super().get_response("index.html", scope)


if not FRONTEND_DIST:
    # Without a built frontend (local development), "/" describes the API.
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


if FRONTEND_DIST:
    # Mounted last so the API routes above always win.
    app.mount("/", SPAStaticFiles(directory=Path(FRONTEND_DIST), html=True), name="frontend")
