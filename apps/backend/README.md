# Fitrah Backend (FastAPI)

Minimal FastAPI boilerplate for the `apps/backend` service in this monorepo.

## Requirements

- Python 3.11+

## Quick Start

```bash
cd /home/jacob/PycharmProjects/fitrah/apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
python -m app
```

API will be available at `http://127.0.0.1:8000`.

## Run Tests

```bash
cd /home/jacob/PycharmProjects/fitrah/apps/backend
source .venv/bin/activate
pytest
```

## Endpoints

- `GET /health` - basic service health/status payload

