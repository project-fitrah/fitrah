# Fitrah Backend (FastAPI)

Minimal FastAPI boilerplate for the `apps/backend` service in this monorepo.

## Requirements

- Python 3.11+
- `uv` package manager

## Install uv (if needed)

On macOS/Linux:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

On any platform with Python already installed:

```bash
python -m pip install --user uv
```

Verify install:

```bash
uv --version
```

## Quick Start

```bash
cd /home/jacob/PycharmProjects/fitrah/apps/backend
uv sync --extra dev
cp .env.example .env
uv run python -m app
```

API will be available at `http://127.0.0.1:8000`.

## Run Tests

```bash
cd /home/jacob/PycharmProjects/fitrah/apps/backend
uv run --extra dev pytest
```

## Endpoints

- `GET /health` - basic service health/status payload

## Deploy on Railway (Backend Only)

This monorepo is configured so Railway builds only the FastAPI backend service.

1. Create a Railway project from this GitHub repo.
2. Make sure the service uses the root `railway.toml` at `/home/jacob/PycharmProjects/fitrah/railway.toml`.
3. Railway will build from `apps/backend/Dockerfile`.
4. Set any backend environment variables in Railway (for example `APP_NAME`, `APP_VERSION`, `DEBUG`).

Notes:

- Railway provides `PORT` automatically; the app reads it via `app/config.py`.
- Health checks use `GET /health`.

