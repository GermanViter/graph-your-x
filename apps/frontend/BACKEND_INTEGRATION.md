# Frontend connection to the Python backend

The frontend reads the FastAPI endpoints:

- `GET /api/topics`
- `GET /api/roadmap/{topic}`

The frontend loads the roadmaps once per app mount and shares their catalog between the picker and graph. Topic goals appear first, followed by individual steps. Labels, descriptions, category, and difficulty come from SQLite through the API.

## Run locally

From the repository root, perform the one-time Windows setup:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r apps/backend/requirements.txt
npm install
npm install --prefix apps/frontend
```

Start both servers from the repository root:

```powershell
npm run dev
```

Backend startup automatically creates and populates SQLite with the starter and demo catalog: 12 topics, 131 concepts, and 180 prerequisite links on a fresh database. No manual seed step is needed. Restarts add missing seed concepts without duplicating or overwriting existing entries and their prerequisite lists. Missing seed concepts are restored at startup, including any deleted from SQLite. The database is ignored by Git, so each teammate gets their own populated copy when they start the backend. See [the demo catalog guide](../backend/DEMO_DATA.md).

Refresh the browser after restarting the backend, then choose a topic in Manage path → Catalog. New catalog data does not automatically change your saved graph.

This starts FastAPI on port 8000 and Vite together. Ctrl+C stops both. For separate terminals, use `npm run backend` and `npm run frontend` from the root. Running `npm run dev` inside apps/frontend still starts only Vite.

Vite forwards /api to http://127.0.0.1:8000. Open the frontend URL printed in the terminal, go to Graph, then Manage path and Catalog.

If you see Backend request failed (502), check that the API process started successfully. Open http://127.0.0.1:8000/api/health to check the API. A missing Python dependency or a stopped backend cannot be fixed by refreshing the frontend alone. After correcting it, click Retry loading courses.

Saved paths remain in the browser. New graph pages start empty; the landing page keeps its illustrative sample.

## Configuration

Defaults work without an `.env.local` file. To change the backend port, copy `.env.example` to `.env.local` and change `BACKEND_PROXY_TARGET`. Restart Vite after changing environment values.

Remove an old `VITE_COURSES_API_URL` setting if you previously configured `/api/courses`: that endpoint is not provided by this backend. The variable is retained only for compatibility with the old course-array API.

The catalog always loads from the backend. Network/API failures show an error and Retry; manual editing still works. Remove the obsolete sample-data environment setting from any local environment files. The built-in landing-page illustration and Restore sample curriculum action are separate from the backend catalog.

## Deployment

The Vite proxy applies to development and local preview only. For production, serve `/api` through a reverse proxy to FastAPI on the same origin, or set `VITE_API_BASE_URL=https://your-backend.example/api` before building. A separate-origin deployment must already be allowed by the backend's CORS policy; the current backend allows localhost:5173 only. This change does not modify that policy.

## Dependency rules and editing

The API defines an edge as `from` prerequisite -> `to` dependent. Only `required` edges become the planner's prerequisite lines. `recommended` edges are shown separately as optional suggestions and do not block readiness. Their concepts remain available to select individually. Shared concepts are deduplicated across roadmaps.

Graph labels use the backend's human-readable labels. The text editor stores stable node IDs (such as `machine-learning`) so names do not break connections or saved progress. Existing custom steps remain supported. Descriptions and recommendations appear in the details panel.

Selections, manual edits, and completion progress are local to the browser. The supplied API only exposes read routes; this frontend does not write changes back to SQLite.

## Validation

```powershell
npm test
npm run build
```

For the optional integration test against the seeded backend through a running Vite server:

```powershell
$env:LIVE_API_URL='http://localhost:5173/api'
npm test
```

The live test expects the bundled three starter topics and at least 26 concepts; additional demo or custom topics are allowed. Regular tests use fixtures and do not require the backend.
