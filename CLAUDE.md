# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Concept Prerequisites Mapper** — a web app built for HackDécouverte 2026 (beginner-friendly hackathon, one day, teams of up to 4).

The user types something they want to learn (e.g. "Machine Learning"). The app shows a colored graph of the concepts they must learn first (e.g. Linear Algebra, Python), connected by prerequisite edges. Users can mark concepts as learned and see a progress bar toward their goal.

Concepts and prerequisites live in a database. For topics not yet in the database, an LLM generates the prerequisite map, which is validated and then saved.

## Priorities (build in this order)

Time is very limited. A small, working, polished demo beats a big broken one. Do not start a later item until the earlier ones work end to end.

1. Graph displays from seeded data
2. User picks a topic and gets its roadmap
3. Mark concepts as learned (node recoloring)
4. Progress bar (`learned / total` nodes in the current roadmap)
5. Persist learned concepts in `localStorage`
6. LLM-generated prerequisites for topics not in the database
7. Accounts (only if everything above is solid; otherwise leave as "future work")

When in doubt, choose the simplest approach that works. Avoid new dependencies unless they save real time.

## Stack

- **Frontend:** React + TypeScript, built with Vite. Graph rendering with **React Flow**.
- **Backend:** Python with **FastAPI**, run with uvicorn.
- **Database:** SQLite (zero setup). Keep SQL portable so we can switch to PostgreSQL later.
- **LLM:** an OpenAI-compatible API (Groq first, Gemini or OpenRouter as fallback), called through the `openai` Python SDK.

The frontend and backend are two separate apps that talk over HTTP with JSON. They do not share code.

## Project structure

```
project/
├── CLAUDE.md
├── backend/
│   ├── main.py            # FastAPI app, routes, CORS
│   ├── db.py              # SQLite connection and queries
│   ├── llm.py             # LLM call, JSON parsing, retries
│   ├── validate.py        # validation of LLM output (schema, cycles)
│   ├── prompts.py         # system and user prompt templates
│   ├── seed.py            # seeds the database with hand-checked topics
│   ├── requirements.txt
│   └── .env               # API keys (never commit)
└── frontend/
    ├── src/
    │   ├── api.ts         # fetch calls and shared types
    │   ├── components/    # Graph, ProgressBar, TopicSearch, ...
    │   └── App.tsx
    └── package.json
```

## Commands

Backend (run from `backend/`):

```
pip install -r requirements.txt
python seed.py                 # create and seed the database
uvicorn main:app --reload      # runs on http://localhost:8000
```

FastAPI's interactive docs are at `http://localhost:8000/docs`.

Frontend (run from `frontend/`):

```
npm install
npm run dev                    # runs on http://localhost:5173
```

Both servers must run at the same time, in separate terminals.

## Environment variables

Backend `.env` (never commit this file; keep a `.env.example` with empty values):

```
LLM_API_KEY=
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
```

Frontend `.env`:

```
VITE_API_URL=http://localhost:8000
```

- Never hardcode API URLs or keys. Always read them from environment variables.
- API keys live only on the backend, never in frontend code.
- To switch LLM provider, change `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODEL`. No code changes should be needed.

## Data model

```
concepts(id TEXT PRIMARY KEY, label TEXT, description TEXT,
         category TEXT, difficulty INTEGER)
prerequisites(concept_id TEXT, requires_id TEXT, type TEXT)
```

- `id` is lowercase kebab-case (e.g. `linear-algebra`).
- `category` is one of: `math`, `programming`, `theory`, `tools`, `domain`.
- `difficulty` is an integer from 1 to 5.
- `type` is `required` or `recommended`.
- An edge `(concept_id, requires_id)` means `requires_id` must be learned before `concept_id`.

Walk a prerequisite chain with a recursive query (`WITH RECURSIVE`).

## API contract

This JSON shape is the contract between frontend and backend. Do not change it without telling the whole team.

`GET /api/roadmap/{topic}` returns:

```json
{
  "goal": "machine-learning",
  "nodes": [
    {
      "id": "linear-algebra",
      "label": "Linear Algebra",
      "category": "math",
      "difficulty": 3,
      "description": "Study of vectors, matrices and linear transformations."
    }
  ],
  "edges": [
    { "from": "linear-algebra", "to": "machine-learning", "type": "required" }
  ]
}
```

Edge direction: `from` is the prerequisite, `to` is the concept that depends on it.

Behavior:
1. If the topic exists in the database, return it from the database.
2. If not, call the LLM, validate the result, save it to the database, then return it.
3. If the LLM fails or validation fails after one retry, return a clean error message. The app must still work for seeded topics.

The frontend can use hardcoded fake data in this shape until the backend is ready.

## Frontend conventions

- TypeScript with strict types. Shared types (`Roadmap`, `RoadmapNode`, `RoadmapEdge`) live in `src/api.ts`.
- Node color is based on `category`. Learned nodes turn green. Edge style is based on `type` (solid for `required`, dashed for `recommended`).
- Progress bar = learned nodes / total nodes in the current roadmap.
- When a concept is marked learned, also offer to mark its prerequisites as learned.
- Save learned concept ids in `localStorage` (key: `learned`). Wrap reads and writes in `try/catch`.
- Show a loading state while the roadmap loads, because LLM calls can take several seconds.
- Label AI-generated roadmaps in the UI ("AI-generated, may need review").
- Keep components small and keep the UI simple and clean. Demo polish matters.

## Backend conventions

- Python 3.10+, type hints on functions.
- CORS must allow the frontend origin (`http://localhost:5173` in development).
- Keep route handlers thin. Put database code in `db.py`, LLM code in `llm.py`, validation in `validate.py`.
- Use parameterized SQL queries, never string formatting.

## LLM feature

Use a low temperature (around 0.2) for consistent output. Strip accidental markdown code fences before calling `json.loads`.

Pass the existing concept ids and labels from the database in the user prompt so the model reuses them instead of creating duplicates.

### System prompt (put in `prompts.py`)

```
You are a curriculum designer building a prerequisite map for a learning
app aimed at beginners (CEGEP / high school students in Quebec).

Given a learning goal, produce the concepts a learner must understand
before they can study that goal, and how those concepts depend on each
other.

OUTPUT RULES
- Reply with ONLY a single JSON object. No markdown, no code fences,
  no explanation before or after.
- Use exactly this schema:
{
  "goal": "<id of the goal node>",
  "nodes": [
    {
      "id": "<lowercase-kebab-case>",
      "label": "<short human-readable name, max 4 words>",
      "category": "<one of: math | programming | theory | tools | domain>",
      "difficulty": <integer 1-5>,
      "description": "<one plain-language sentence, max 20 words>"
    }
  ],
  "edges": [
    {
      "from": "<prerequisite node id>",
      "to": "<node id that depends on it>",
      "type": "<required | recommended>"
    }
  ]
}

CONTENT RULES
1. Include the goal itself as a node, and make it the final target.
2. Return between 8 and 14 nodes, including the goal.
3. Each node is ONE learnable concept, not a whole course.
   Good: "matrix-multiplication". Bad: "mathematics".
4. An edge from A to B means: A must be understood before B.
5. "required" = the learner will be stuck without it.
   "recommended" = helpful but not blocking. Use "recommended" sparingly.
6. The graph must be acyclic. No node may depend on itself,
   directly or indirectly.
7. Every node must connect to the goal through some chain of edges.
   No isolated nodes.
8. Assume the learner knows only basic high school math and has
   no programming experience. Start from true beginner level.
9. Difficulty 1 = no prior knowledge needed, 5 = advanced.
   A node's difficulty must be >= the difficulty of its required
   prerequisites.
10. Use concrete, standard concept names, not vague ones.
11. Do not invent concepts. If you are unsure whether something is a
    real prerequisite, leave it out.
12. Ids must be unique and every id used in "edges" must appear in
    "nodes".
```

### User prompt template

```
Learning goal: "{topic}"

These concepts already exist in our database. If a concept you need
matches one of these, REUSE its exact id and label instead of creating
a new one:
{existing_concepts}

Generate the prerequisite map.
```

### Validation (put in `validate.py`)

Never trust LLM output. After parsing, check:
- The JSON matches the schema, and `category`, `type` and `difficulty` have allowed values.
- `goal` is one of the node ids, and node ids are unique.
- Every edge's `from` and `to` exist in `nodes`.
- No cycles (use `graphlib.TopologicalSorter`, which raises `CycleError`).
- Every node connects to the goal.

If validation fails, retry once. If it still fails, return an error. Only save to the database after validation passes.

## Seed data

`seed.py` loads a small set of hand-checked topics (for example: Machine Learning, Web Development, Cybersecurity). Quality matters more than quantity: 3 to 5 well-built topics beat 50 weak ones.

Seed concepts are shared between topics (for example Python and Linear Algebra are prerequisites of many things), so reuse ids instead of duplicating them.

Pre-generate and save the demo topics before judging so the main demo path never depends on a live API call.

## Do not

- Do not commit `.env` files or API keys.
- Do not change the API contract silently.
- Do not add authentication until priorities 1 to 6 work. If accounts are added, keep them minimal and describe them honestly as a prototype.
- Do not rely on the LLM for the main demo path. Seeded topics must always work.
- Do not add large dependencies or refactor working code late in the event.