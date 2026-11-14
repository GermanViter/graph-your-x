# Automatic test catalog

Start the app from the repository root with `npm run dev`. Backend startup creates
`apps/backend/data.db` if needed and fills in missing starter and demo concepts
before accepting API requests. Teammates get the catalog automatically after
installing the project dependencies and starting the app; no separate seed command
is required. This also works when starting FastAPI directly.

The demo content adds 105 concepts, 150 prerequisite links, and nine topics to the
starter catalog. An empty database receives **131 concepts, 180 links, and 12
topics** in total. Existing additional content can increase these totals.

The new topics are Game Development, Mobile App Development, Robotics, Cloud and
DevOps, Data Analytics, UX and Interface Design, Music Production, Digital
Illustration, and Photography. These are illustrative test paths, not official
curricula. They include branching prerequisites, shared concepts, optional
recommendations, and difficulties from 1 to 5.

## How it works

- `main.py` calls `seed_demo()` during backend initialization.
- `demo_data.json` contains the extra concepts and edges. Each edge points from
  its prerequisite (`from`) to the step that depends on it (`to`). Its type is
  `required` or `recommended`.
- `seed_demo.py` validates the data, references, and absence of cycles before
  inserting it. New concepts and their edges are inserted in one transaction.
- Existing concepts and their prerequisite lists are left unchanged. Restarting
  does not duplicate records, overwrite edited labels, or restore removed links
  on an existing concept. Editing the JSON does not update existing SQLite rows.
- A missing seed concept is inserted on the next backend startup, including one
  deliberately deleted from SQLite. User-created concepts are preserved.
- New IDs use a `demo-` prefix; some paths also reuse starter concepts such as
  Python and Linear Algebra. Missing starter concepts are inserted without
  running the original seed script's update behavior.

After restarting the backend, refresh the browser, then open **Graph → Manage
path → Catalog** and select a topic. Seeding populates the catalog; it does not
automatically add nodes to the user's saved graph. The frontend continues to load
everything through FastAPI, not directly from this JSON file.

Commit the startup code, seed script, and JSON together. The local `data.db` remains
ignored by Git; each teammate's backend creates and populates its own database.

## Manual use

To populate the database without starting the server, run this from the repository
root on Windows:

```powershell
.\.venv\Scripts\python.exe apps/backend/seed_demo.py
```

On macOS/Linux, use `.venv/bin/python apps/backend/seed_demo.py`.
Use the project environment with the backend requirements installed.
