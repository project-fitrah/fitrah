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
| Hosting | Railway (long-lived streams, no serverless timeouts). OPEN (T2): confirm, and whether to use Railway PR environments for preview deploys |

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

OPEN (T16): the embedding model fixes the vector column size; choose it before writing the migrations.
OPEN (T1): which Supabase project is the real one; separate dev and prod projects (recommended).

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
