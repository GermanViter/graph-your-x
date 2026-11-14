# Frontend connection to the Python backend

Only frontend files are changed. The application reads the existing FastAPI endpoints:

- `GET /api/topics`
- `GET /api/roadmap/{topic}`

The frontend loads the roadmaps once per app mount and shares their catalog between the picker and graph. Topic goals appear first, followed by individual steps. Labels, descriptions, category, and difficulty come from SQLite through the API.

## Run locally

In a terminal, start the existing backend using its current code:

```powershell
cd apps/backend
python -m pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 8000
```

Run `seed.py` only when you need the bundled starter topics; it inserts or updates that starter content. The ZIP does not include a populated database. The backend creates its tables automatically, but an unseeded database returns an empty topics list.

In a second terminal:

```powershell
cd apps/frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000`, so the frontend works without changing backend CORS. Open the Vite URL, go to Graph, click **Manage path**, then choose a topic in **Catalog**.

Saved browser paths are preserved. A new graph starts empty so sample courses are not mixed with real database content. The landing page keeps its existing illustrative sample. You can clear an old saved sample using **Clear graph** before choosing a database topic.

## Configuration

Defaults work without an `.env.local` file. To change the backend port, copy `.env.example` to `.env.local` and change `BACKEND_PROXY_TARGET`. Restart Vite after changing environment values.

Remove an old `VITE_COURSES_API_URL` setting if you previously configured `/api/courses`: that endpoint is not provided by this backend. The variable is retained only for compatibility with the old course-array API.

`VITE_USE_SAMPLE_DATA=true` explicitly enables the local `data.json` demo. It is not a fallback when the backend is unavailable. With the default live mode, network/API failures show an error and Retry; manual editing still works.

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

The live test expects the bundled three topics and 26 concepts. Regular tests use fixtures and do not require the backend.
