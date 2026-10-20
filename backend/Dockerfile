FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# Las migraciones Alembic y el seed se ejecutan al arrancar la aplicacion
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
