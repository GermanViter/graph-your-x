# Graph Your X — judge Q&A and demo guide

## A short explanation

Graph Your X turns courses and learning steps into an interactive dependency map. Users choose a topic, see what they need to learn first, and track their progress. They can also build their own paths with a guided form or text editor.

Our initial use case is course and learning-path planning. The same dependency model could support project planning and employee onboarding, but those markets still need validation.

## How the working prototype is built

- React and TypeScript render the frontend; Vite runs the development server and builds the app.
- Python FastAPI serves the existing HTTP API.
- SQLite stores concepts, prerequisite relationships, and selectable topics.
- GET /api/topics returns the available topics.
- GET /api/roadmap/{topic} returns a goal, nodes, and edges for a topic.
- Each node has an ID, label, description, category, and difficulty from 1 to 5.
- Each edge points FROM a prerequisite TO the step that depends on it, and is either required or recommended.
- A shared frontend provider loads topic roadmaps and combines them into a catalog, deduplicating shared concepts.
- The frontend converts required edges into prerequisite lists. Its graph parser positions steps in columns according to dependency depth.
- Recommended dependencies appear as optional suggestions. They are not mandatory graph connections and do not block readiness.

The browser does not open SQLite directly. Requests go through FastAPI. During local development, Vite forwards /api requests to FastAPI on port 8000. A deployed site needs an equivalent reverse proxy or a configured API URL with appropriate backend CORS.

## Demo sequence

1. Start the backend and frontend using BACKEND_INTEGRATION.md. Seed the database if starter data is needed.
2. Open Graph, then Manage path and Catalog.
3. Choose Machine Learning. Show the required prerequisite chain and the human-readable node labels.
4. Select a node and show its description, category, difficulty, and optional recommendations where present.
5. Mark a prerequisite completed and show how the next step becomes ready.
6. Pan the graph, zoom in, and use Fit to screen.
7. Add a custom learning step with the guided form.
8. Briefly show the text format and Apply changes. Explain that indentation is visual; names after the colon define dependencies.

Before presenting, rehearse the actual browser flow on the demo machine. Do not assume automated tests replace this rehearsal. Have a screenshot or short recording available in case the live environment fails.

## Likely technical questions

### What happens when someone selects a topic?
The frontend adds its missing required prerequisites recursively, then the selected topic. Existing explicit definitions and manual edits are preserved. Required concepts shared by several paths are not duplicated.

### What does ready mean?
A step is ready when all of its direct required prerequisites are marked complete. Completed steps have their own status; other steps are locked. Completion is self-reported. The prototype does not verify transcripts or enforce real enrollment eligibility.

### Where is information saved?
The shared catalog is in SQLite. On the graph page, the selected path and completion progress are stored in browser localStorage. These are not linked to an account or synchronized across devices. Clearing browser storage can remove them.

### Are custom paths saved to the database?
No. The current API exposes read endpoints, not a frontend write endpoint. Custom steps, removals, and edits affect the personal browser plan, not the shared database.

### What happens if a prerequisite is removed?
Deselecting a step also removes selected steps that depend on it, rather than silently deleting their requirements. Applying a manual deletion follows the same rule. Undo is available for the last applicable edit. Users can intentionally change prerequisite lists in their personal plan.

### How are required and recommended connections different?
Required connections are used to build the prerequisite graph and calculate readiness. Recommendations are displayed as optional information, and users can select those concepts separately.

### What if the backend is unavailable?
The catalog displays an error and Retry. Existing personal paths and manual editing remain usable. The app does not silently replace database data with sample data. The catalog is backend-only; the landing-page illustration and Restore sample curriculum action remain separate built-in examples.

### Does the system use AI to generate paths?
Not through the current exposed API or frontend integration. The implemented flow reads stored roadmaps. Do not describe automatic AI generation as a working feature.

### Does it support every real course rule?
No. The current model represents required and recommended concept relationships. It does not model every enrollment rule, such as minimum grades, alternative prerequisite groups, co-requisites, term availability, or institutional exceptions.

### Can it handle cycles?
Graph traversal includes protection against infinite loops, and the manual editor validates circular dependencies. That does not make a circular learning path valid; real catalog data still needs review.

### How was the integration tested?
The frontend production build and lint checks for changed files passed. All 43 frontend tests passed during integration verification, including a live test through Vite to the actual FastAPI application using a temporary SQLite database populated by the supplied seed script. The seed contains three topics and 26 concepts. Two pre-existing route-file lint errors remained. Full browser interaction and visual testing was not completed.

### What changed in the integration?
Only frontend files were changed. The integration added an API adapter, shared catalog state, metadata display, Vite proxy configuration, tests, and setup documentation. Non-frontend files were checked against the supplied archive and remained unchanged.

## Market and business questions

These are proposed directions, not validated traction or financial results.

### Who is the initial user?
Students and self-directed learners trying to understand multi-step prerequisite paths. Start with one program or learning community rather than claiming the product is already for everyone.

### Who could pay?
Potential buyers include academic departments, advising teams, and organizations managing structured training. Students or employees could use the product while an institution pays for shared features.

### How could it make money?
A proposed model is free personal planning with paid team or institutional features, such as shared templates, managed catalogs, assignments, and collaboration. Those paid features are future work, not current capabilities. Pricing and willingness to pay must be tested through interviews and pilots.

### Why use this instead of a checklist?
A checklist shows items. A dependency graph also shows what each item unlocks and what must come first. The value hypothesis is that this makes complex learning paths easier to understand; user testing must establish whether it does.

### Are there competitors?
Academic planning and project planning tools already exist. Do not claim this is the first prerequisite planner. Describe the intended focus: approachable visual exploration and editable learning paths. Verify any specific competitor or market-size claim before presenting it.

### What is the defensible advantage?
The graph interface alone is easy to copy. Reliable curriculum data, useful integrations, institutional relationships, and demonstrated user outcomes could become stronger advantages over time. They are not yet established.

### What is the next milestone?
Pilot one accurate, real-world path with users and an advisor or subject expert. Measure whether users identify prerequisites faster and more accurately, how often they complete a planning task, and what causes confusion. Then test whether a potential buyer would pay for the results.

## Be clear about current limitations

- No accounts, cross-device sync, or database writes from the frontend.
- No working AI roadmap-generation endpoint in this integration.
- No transcript verification or guarantee that a real institution will permit enrollment.
- Catalog accuracy and maintenance still require trusted sources or expert review.
- No validated pricing, paid customers, measured retention improvement, or proven reduction in graduation delays established by this project work.
- Production deployment, security review, and larger-scale performance testing remain future work.

## Closing line

Graph Your X helps people see what comes first, what is blocking them, and what each completed step unlocks.
