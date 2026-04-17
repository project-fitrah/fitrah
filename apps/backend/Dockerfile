FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY apps/backend/pyproject.toml /app/pyproject.toml
COPY apps/backend/README.md /app/README.md
COPY apps/backend/app /app/app

RUN pip install --upgrade pip && pip install .

EXPOSE 8000

CMD ["python", "-m", "app"]

