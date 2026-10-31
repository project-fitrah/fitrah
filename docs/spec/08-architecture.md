# 08 — Architecture

## Components
```
apps/web (Next.js) ──SSE/HTTP──► apps/backend (FastAPI, Railway) ──► OpenRouter / Jev
      │                                   │
      └──── Supabase Auth ◄───────────────┤
                                          ▼
apps/admin (Next.js) ───────────────► Supabase (Postgres + pgvector + Auth + RLS)
```

- **Web** talks to the backend for conversations, and to Supabase Auth for sessions.
- **Backend** runs the engine (`02-engine.md`), verifies Supabase JWTs, writes conversations and events.
- **Admin** reads and writes KB content and dashboards directly on Supabase with RLS by role. Recording transcription and structuring stay in admin route handlers.
- **Supabase** is the only database (decided).

## Hosting
- Backend: Railway, built from `apps/backend/Dockerfile`.
- OPEN (T2): web and admin on Vercel (as the README says) or on Railway too? And how is the backend deployed now that `railway.toml` was deleted on `main`?
- OPEN (T1): which Supabase project is the real one; separate dev and prod projects (recommended).

## Data model (summary)
All tables are created through migrations in `packages/database/supabase/migrations/`, with RLS on every table.

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

The current tables (`phases`, `phase_requirements`, `behavior_examples`, `documents`, `conversations`, `messages`) and the RPCs `match_documents` and `match_behavior_examples` exist only in a Supabase project, not in migrations. M0 first captures them as migrations, then the new schema replaces them.

OPEN (T16): the embedding model fixes the vector column size; choose it before writing the M0 migrations.

## LLM access
- One OpenAI-compatible client pointed at OpenRouter. Model per role in config (`02-engine.md`). The `llm-provider` branch's factory and the Groq provider are removed.
- Jev, if used, through its own API, behind the tracker interface.

## Cost and abuse
- Rate limit per session and per IP (in memory or Redis on Railway if needed).
- A token budget per conversation and a daily cap for the whole site; when exceeded, a friendly "come back later".
- OPEN (T4): monthly budget, and the cost per conversation to plan around.
- Prompt injection and jailbreaks are covered by the safety check, the guide's rules, and red-team evals (`09-evals.md`).

## Observability
- Per turn, a trace: tracker input/output, director decision, retrieved items, guide prompt and reply, latency and cost per call. Stored for a limited period (OPEN, recommendation 30 days), access for admins only.
- Error monitoring for backend and web.

## Configuration
Backend env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET` (or JWKS), `OPENROUTER_API_KEY`, `TYPESAFE_API_KEY` (optional), model per role. Keep `apps/backend/.example.env` in sync, and fix the README reference to it.

## Acceptance criteria
- The full schema can be created from scratch on an empty Supabase project with migrations only.
- No service-role key reaches the browser.
- A per-turn trace exists for every guide reply.
