# AGENTS.md

Guidance for AI agents working in the Fitrah monorepo.

## Project Shape

Fitrah is an interactive spiritual journey platform powered by AI-guided logical reasoning. Treat this as a small pnpm/Turbo monorepo with a separate Python backend.

- `apps/web`: public Next.js 16 App Router frontend with React 19, Tailwind CSS and Vercel AI SDK.
- `apps/admin`: Next.js 16 admin dashboard with Supabase SSR, recordings, transcription and AI structuring flows.
- `apps/backend`: FastAPI service using Python 3.11+, `uv` and pytest.
- `packages/config`: shared ESLint, Prettier and TypeScript configuration.
- `packages/database`: Supabase/PostgreSQL migrations. This is not an npm package.
- `docs/logic_flows`: scholar-authored Markdown logic flows and dawah methodology context.

## Agent Workflow

1. Start from the closest source file and read the relevant README before editing.
2. For chat, reasoning, prompt, dawah or content changes, read `docs/logic_flows/README.md` first.
3. Keep changes scoped to the app or package involved. Do not refactor shared config or database schema unless the task requires it.
4. Prefer source files over generated output. Never edit build artifacts or caches.
5. Preserve existing runtime boundaries: browser code in client components, server-only secrets in route handlers/server utilities, backend behavior in FastAPI.
6. When changing behavior, update or add the narrowest useful tests. The repo currently has backend tests but no frontend test suite.

## Commands

Install dependencies:

```bash
pnpm install
```

Run local services:

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:backend
```

Validate changes:

```bash
pnpm lint
pnpm typecheck
pnpm test:backend
```

Targeted frontend builds:

```bash
pnpm build:web
pnpm build:admin
```

Backend setup if working directly inside `apps/backend`:

```bash
uv sync --extra dev
uv run python -m app
uv run --extra dev pytest
```

## Generated Files And Folders

Do not edit or use these as source of truth:

- `node_modules/**`
- `.next/**` and `**/.next/**`
- `out/**`
- `dist/**`
- `build/**`
- `.turbo/**`
- `.vercel/**`
- `.venv/**`, `venv/**`, `__pycache__/**`
- `.pytest_cache/**`
- `coverage/**`
- `*.tsbuildinfo`
- `next-env.d.ts`

Turbo build outputs are configured in `turbo.json` as `.next/**` and `dist/**`. Change source files instead.

## Security And Secrets

- Never commit `.env`, `.env.*`, `.env*.local`, API keys, Supabase service-role keys, Anthropic keys or Deepgram keys.
- Use `apps/admin/env.example` as the reference for admin environment variables.
- Keep Supabase service-role usage server-side only.
- Treat user recordings and transcripts as sensitive data.
- For database changes, add migrations under `packages/database/supabase/migrations/` and keep row level security explicit.

## Area Notes

### Web

`apps/web` is the public chat surface. The current `/api/chat` route streams a placeholder text response. Keep streaming behavior intact unless the task explicitly changes it.

### Admin

`apps/admin` owns authentication, recordings, transcription token routes and AI structuring. Keep Supabase auth/session handling in existing server utilities and route handlers.

### Backend

`apps/backend` is a minimal FastAPI service with an app factory and health endpoint. Use `uv` for dependency and test commands.

### Database

`packages/database` contains Supabase SQL migrations. Do not treat it as a TypeScript workspace package.

### Logic Flows

`docs/logic_flows` is the domain source for AI reasoning and dawah methodology. Keep durable reasoning content there instead of hardcoding it into UI components.

## Known Gaps

- No frontend test suite is configured.
- No CI workflow is present.
- `apps/backend/README.md` references `.env.example`, but that file is not currently present in the backend app.
