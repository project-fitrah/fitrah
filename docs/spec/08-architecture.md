# 08 — Architecture

## Principles
The stack is tuned for building with AI agents: **one language (TypeScript), one app, shared types end to end, and fast feedback loops** the agent can run itself (types, unit tests, e2e, evals, CI).

## Components
```
Browser ──► Next.js app (Railway) ──► OpenRouter (guide, tracker/Jev, safety, embeddings)
                 │
                 ▼
            Supabase (Postgres + pgvector + Auth + RLS)
```

- **One Next.js app** serves the public site, the admin (`/admin`, behind a role check) and the API (route handlers). The separate `apps/web`, `apps/admin` and `apps/backend` go away.
- **The engine** (`02-engine.md`) lives in `lib/engine/` as plain TypeScript functions, called from route handlers. The director has no I/O, so it's unit-testable without mocks.
- **Supabase** is the only database (decided).
- Server-only code (service-role client, model calls) stays in route handlers and `server-only` modules. No secret reaches the browser.

## Stack
| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS 4 |
| 3D | React Three Fiber + drei, zustand for client state |
| Models | Vercel AI SDK with the official OpenRouter provider (`@openrouter/ai-sdk-provider`): streaming text, schema-constrained output (with OpenRouter's response-healing plugin), embeddings |
| Schemas | Zod: one schema per contract (tracker output, API bodies), shared by server and client |
| Database | Supabase: Postgres, pgvector, Auth, RLS. Supabase CLI for local dev, migrations and generated TypeScript types |
| Transcription | Deepgram (existing recordings pipeline) |
| Tests | Vitest (unit), Playwright (e2e), eval script (`09-evals.md`) |
| Lint/format | ESLint + Prettier (existing shared config) |
| Package manager | pnpm. No Turbo: a single app doesn't need it |
| CI | GitHub Actions: lint, typecheck, unit tests on every PR |
| Hosting | Railway (long-lived streams, no serverless timeouts). See "Current infrastructure" |

## Current infrastructure (checked 2026-11-03)
- **Supabase** project `dotcysplrumgqhmnmeqk`: has the six tables of the old RAG backend (`documents`, `behavior_examples`, `phases`, `phase_requirements`, `conversations`, `messages`), RLS on, **all empty**. No migration history (the tables were made by hand). The `recordings` table is missing, so the admin's recordings pipeline never ran against this project. Extensions: `vector` 0.8.0, `pg_cron`, `pgcrypto`.
- **Railway** project `heroic-stillness` (workspace "project-fitrah's Projects"), one `production` environment in `europe-west4`, two services deploying from `main`:
  - `Frontend`: last deploy 2026-07-01, sleeping.
  - `Backend`: every deploy fails because its config points to `/railway.toml`, which was deleted in July.
- M0 replaces both services (approved) with one service for the single app (root directory `/`, health check `/api/health`), and a dev/preview environment next to `production`.

**Decided (T1):** this project is **dev**; its tables are dropped and rebuilt from migrations in M0. A separate **prod** project, in the EU, is created before real users arrive (M7).

**Railway plan (T2):** the free trial has ended, so services won't run until the workspace is on a paid plan. The Hobby plan is about $5/month, which includes $5 of usage (check railway.com/pricing). Needed before the M0 deploy.

## Repository layout
```
app/              routes: (site)/, admin/, api/
components/       UI and 3D components
lib/engine/       tracker, director, retrieval, guide, prompts
lib/supabase/     one set of client/server helpers
lib/schemas/      Zod schemas
supabase/         migrations/, seed.sql, config.toml (Supabase CLI)
evals/            personas, tracker cases, runner
docs/spec/        this spec
docs/logic_flows/ methodology drafts during capture
```

## Local development
- `supabase start` runs Postgres, Auth and the API locally (Docker). `supabase db reset` applies all migrations and the seed.
- `supabase gen types typescript --local` regenerates database types after every migration.
- An agent can reset the database, run the app, and run all tests without any shared environment.

## Data model (summary)
All tables are created through migrations in `supabase/migrations/`, with RLS on every table.

| Table | Purpose |
|---|---|
| `graph_versions` | Published versions of the point graph |
| `stages` | Per version: key, title, order, scene_key, intro_guidance |
| `points` | Per version: key, stage, statement, guidance, agreement_criteria, required |
| `point_prerequisites` | point → required point |
| `point_routes` | Argument routes per point, with order |
| `objections` | Summary, example phrasings, imam's answer, embedding, status, approved_by |
| `objection_points` | Objection ↔ point |
| `examples` | User message, good/bad reply, reason, point/mode, embedding, status (replaces `behavior_examples`) |
| `sources` | Type (Quran/hadith), reference, Arabic text, translation, language, approved_by |
| `point_sources` | Point ↔ source |
| `persona` | Tone guidelines (versioned) |
| `conversations` | User, graph version, entry, status, started/ended |
| `messages` | Conversation, role, content, mode, focus point |
| `point_states` | Conversation, point, state, confidence, evidence message, updated_at |
| `kb_usage` | Message ↔ KB items used (with version) |
| `events` | Analytics events (`07-admin.md`) |
| `user_roles` | User ↔ role |
| `recordings` | Existing |

The current backend tables (`phases`, `phase_requirements`, `behavior_examples`, `documents`, `conversations`, `messages`) and the RPCs `match_documents` and `match_behavior_examples` exist only in a Supabase project, not in migrations. They are replaced by the schema above; nothing from them needs to be kept apart from the seed content in `apps/backend/seed.py`.

**Embeddings (decided, T16):** `google/gemini-embedding-001` via OpenRouter, stored at **1536 dimensions** (pgvector's HNSW index supports at most 2000 for `vector`, so the default 3072 won't index). Check it on a small Dutch retrieval set in M2. The KB is small, so switching later only means re-embedding.

## Model access
- Everything goes through OpenRouter with one API key, including **Jev** (listed on OpenRouter in beta as `typesafe/jev-latest`). The model per role is set in config (`02-engine.md`).
- Jev's API naming differs between routes (e.g. question types, response fields). Wrap it behind the tracker interface and pin a model version.

## Cost and abuse
- Rate limit per session and per IP. A single Railway instance can keep this in memory; move it to Postgres if the app scales out.
- A token budget per conversation and a daily cap for the whole site; when exceeded, a friendly "come back later".
- OPEN (T4): monthly budget, and the cost per conversation to plan around.
- Prompt injection and jailbreaks are covered by the safety check, the guide's rules, and red-team evals (`09-evals.md`).

## Observability
- Per turn, a trace: tracker input/output, director decision, retrieved items, guide prompt and reply, latency and cost per call. Stored for a limited period (OPEN, recommendation 30 days), access for admins only.
- Error monitoring for server and client.

## Configuration
Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `DEEPGRAM_API_KEY`, model per role. One `.env.example` at the root, kept in sync.

## Acceptance criteria
- `supabase db reset` builds the full schema from scratch.
- No service-role key reaches the browser.
- `pnpm lint && pnpm typecheck && pnpm test` pass locally and in CI.
- A per-turn trace exists for every guide reply.
