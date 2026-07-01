
# Fitrah

Interactive spiritual journey platform powered by AI-guided logical reasoning.

## Monorepo Layout

- `apps/web`: Next.js 16 App Router frontend (TypeScript, Tailwind CSS, Vercel AI SDK)
- `apps/backend`: FastAPI backend service (Python 3.11+, pytest)
- `packages/config`: Shared ESLint, Prettier, and TypeScript configuration
- `packages/database`: Supabase/PostgreSQL schema with pgvector support
- `docs/logic_flows`: Markdown logic flows and Dawah methodologies

## Quick Start

1. Install dependencies:

	```bash
	pnpm install
	```

2. Start frontend locally:

	```bash
	pnpm dev:web
	```

3. Run all configured tasks:

	```bash
	pnpm dev
	```

4. Start backend locally:

	```bash
	cd apps/backend
	uv sync --extra dev
	uv run python -m app
	```

## Deployment

- `apps/web` and `apps/admin`: deploy to Vercel.
- `apps/backend`: deploy to Railway using the root `railway.toml` and `apps/backend/Dockerfile`.

