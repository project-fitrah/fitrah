# Roadmap

The engine is the product, so it comes first. 3D comes deliberately late. Each milestone has acceptance criteria; the referenced spec files hold the details.

## M0 — Cleanup and foundations
- Merge `RAG` into `main`; delete the `dashboard`, `dev` and `llm-provider` branches.
- Capture the existing Supabase schema and RPCs as migrations.
- Replace the LLM layer with one OpenRouter client, with the model per role in config; embeddings through OpenRouter.
- Fix stale docs: `railway.toml` reference, `.env.example` vs `.example.env`, `AGENTS.md` backend section.

Done when: a fresh Supabase project can be set up from migrations; the backend runs against OpenRouter; tests pass.
Needs first: T16 (embedding model), T1 (which Supabase project).

## M1 — Capture one stage of the imam's structure
- Workshop with the imam and recordings (`03-knowledge-base.md`).
- Points, prerequisites, routes, objections, sources for **one stage**, entered as data.
- Dry run on paper: walk one real conversation through the point model and the engine.

Done when: one stage exists as data, approved by the imam, and the dry run fits.
Needs first: C1–C5.

## M2 — Text-only engine and evals
- New schema (`08-architecture.md`), tracker, director, retrieval, guide (`02-engine.md`).
- Safety check and safety mode.
- Eval harness with personas (`09-evals.md`); choose models per role.

Done when: the M1 stage can be completed via the API by the agnostic persona; jailbreak, crisis and minor personas behave as specified; no invented sources.

## M3 — Web chat and accounts
- `apps/web` talks to the backend with SSE streaming; text-only mode.
- Anonymous sessions, consent, linking to an account, resume and delete (`06-accounts-privacy.md`).
- Rate limiting and budget caps.

Done when: a visitor can complete the stage in the browser, save it, and resume it on another device.

## M4 — Admin content tools
- Roles; graph editor; KB editor with draft → approve; conversation viewer (`07-admin.md`).
- "Propose KB items" from recordings.

Done when: the imam can add a point and an objection answer without a developer.

## M5 — Analytics and learning loop
- Events, funnel and objection dashboards; usage logging; promote-to-example (`04-learning-loop.md`).

Done when: drop-off per point and agreement rate per answer are visible.

## M6 — 3D story layer
- Narrative arc and places per stage (C12); the guide's representation (C7).
- Scenes per stage, transitions, lazy loading, performance budget (`05-experience.md`).

Done when: completing a stage moves the user to the next place on desktop and mid-range mobile.

## M7 — Beta and reach
- Closed beta through the imam's network; review conversations together with the imam.
- Expand to further stages; reach plan (C13).

## Open decisions, in priority order
| # | Decision | Blocks | Spec |
|---|---|---|---|
| T16 | Embedding model | M0 | `08`, `02` |
| T1 | Real Supabase project, dev/prod split | M0 | `08` |
| C1 | The imam's structure (points, dependencies) | M1 | `01`, `03` |
| C2 | What counts as agreement | M1 | `01` |
| C3 | Handling firm disagreement | M1 | `01` |
| C4 | Audience and entry points | M1 | `00`, `01` |
| C5 | End goal / human handoff | M1 | `00`, `05` |
| C8 | Content approval, translations, contested topics | M1 | `03` |
| C9 | Minors and vulnerable users | M2 | `02`, `06` |
| C6 | Language(s) | M2 | `03`, `05` |
| T4 | Budget and cost per conversation; Jev access | M2 | `02`, `08` |
| T2 | Hosting of web/admin, backend deploy | M3 | `08` |
| T10 | Data residency, legal review | M3 | `06` |
| C10 | Space for off-topic questions | M2 | `02` |
| C11 | What defines a "good" answer | M5 | `04` |
| C7 | The guide's representation | M6 | `05` |
| C12 | Narrative arc | M6 | `05` |
| C13 | Reach owner and plan | M7 | `00` |
