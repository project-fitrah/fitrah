# Roadmap

The engine is the product, so it comes first. 3D comes deliberately late. Each milestone has acceptance criteria; the referenced spec files hold the details.

## Status
Claim a milestone or task here before starting it (see `AGENTS.md`, "Working together").

| Milestone | Status | Owner | Branch |
|---|---|---|---|
| M0 One app, one language | not started | — | — |
| M1 Capture one stage | not started | — | — |
| M2 Text-only engine and evals | not started | — | — |
| M3 Web chat and accounts | not started | — | — |
| M4 Admin content tools | not started | — | — |
| M5 Analytics and learning loop | not started | — | — |
| M6 3D story layer | not started | — | — |
| M7 Beta and reach | not started | — | — |

Status values: `not started`, `in progress`, `in review`, `done`.

## M0 — One app, one language
- Delete the stale branches (`RAG`, `dashboard`, `dev`, `llm-provider`) and close PR #6.
- Merge `apps/web` and `apps/admin` into one Next.js app at the repo root; admin under `/admin` behind a role check; one set of Supabase helpers. Remove Turbo and `packages/config` if nothing else uses it.
- Remove `apps/backend` (FastAPI). Keep its seed content as a reference for M1.
- Supabase CLI: `supabase/` with migrations (starting with the existing `recordings` table), local dev, generated types.
- Model access: Vercel AI SDK with the OpenRouter provider; model per role in config.
- Tooling: Vitest, Playwright, GitHub Actions (lint, typecheck, test).
- Docs: update the "Current state" and "Commands" sections of `AGENTS.md` and the README for the new layout.
- Railway: replace the `Frontend` and `Backend` services with one service for the single app (root `/`, health check `/api/health`); add a dev environment.

Done when: `supabase db reset` and `pnpm dev` give a working site and admin locally; `pnpm lint && pnpm typecheck && pnpm test` pass in CI; the app is live on Railway.
Needs first: T16 (embedding model), T1 (Supabase dev/prod), T2 (Railway).

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
- The site's chat talks to the engine's API with streaming; text-only mode.
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
| T1 | Supabase: current project as dev, new EU prod project? | M0 | `08` |
| T2 | Railway: OK to replace both services; who owns the workspace and billing | M0 | `08` |
| C1 | The imam's structure (points, dependencies) | M1 | `01`, `03` |
| C2 | What counts as agreement | M1 | `01` |
| C3 | Handling firm disagreement | M1 | `01` |
| C4 | Audience and entry points | M1 | `00`, `01` |
| C5 | End goal / human handoff | M1 | `00`, `05` |
| C8 | Content approval, translations, contested topics | M1 | `03` |
| C9 | Minors and vulnerable users | M2 | `02`, `06` |
| C6 | Language(s) | M2 | `03`, `05` |
| T4 | Budget and cost per conversation; Jev access | M2 | `02`, `08` |
| T10 | Data residency, legal review | M3 | `06` |
| C10 | Space for off-topic questions | M2 | `02` |
| C11 | What defines a "good" answer | M5 | `04` |
| C7 | The guide's representation | M6 | `05` |
| C12 | Narrative arc | M6 | `05` |
| C13 | Reach owner and plan | M7 | `00` |
