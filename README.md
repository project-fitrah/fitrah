
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
	python -m venv .venv
	source .venv/bin/activate
	pip install -e '.[dev]'
	python -m app
	```

