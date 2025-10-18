## File structure
```
backend/
├─ alembic.ini
├─ migrations/
│  ├─ env.py
│  └─ versions/                 # autogen files live here
├─ app/
│  ├─ main.py                   # FastAPI app factory + GraphQL mount
│  ├─ core/
│  │  ├─ settings.py            # Pydantic BaseSettings (DB URL, JWT, CORS)
│  │  └─ security.py            # auth helpers (JWT decode, role checks)
│  ├─ db/
│  │  ├─ session.py             # engine, SessionLocal, get_db()
│  │  └─ init_db.py             # seeders (credential types, specialties)
│  ├─ models/
│  │  ├─ __init__.py            # imports worker, facility, jobs -> register mappers
│  │  ├─ base_model.py          # Base, Enums, Endorsement
│  │  ├─ worker.py
│  │  ├─ facility.py
│  │  └─ jobs.py
│  ├─ schemas/                  # Pydantic DTOs
│  │  ├─ common.py              # Enums & base response, pagination
│  │  ├─ filters.py             # filter DTOs (workers/jobs)
│  │  ├─ worker.py
│  │  ├─ facility.py
│  │  ├─ jobs.py
│  │  └─ auth.py
│  ├─ repositories/             # DB queries only (no business rules)
│  │  ├─ base.py
│  │  ├─ workers.py
│  │  ├─ facilities.py
│  │  └─ jobs.py
│  ├─ services/                 # business logic / invariants
│  │  ├─ workers_service.py
│  │  ├─ facilities_service.py
│  │  └─ jobs_service.py
│  ├─ api/
│  │  ├─ deps.py                # FastAPI deps (get_db, current_user, role guards)
│  │  └─ v1/
│  │     ├─ __init__.py
│  │     └─ routers/
│  │        ├─ workers.py       # GET /workers, GET /workers/{id}
│  │        ├─ facilities.py    # GET /facilities, POST /facilities/{id}/jobs
│  │        ├─ jobs.py          # GET /job-posts, GET /job-posts/{id}, POST apply
│  │        └─ auth.py          # (placeholder) login/register if needed
│  └─ graphql/
│     ├─ schema.py              # Strawberry/Ariadne schema factory
│     ├─ types.py               # GraphQL types mapped from models/schemas
│     └─ resolvers.py           # Queries/Mutations using services
└─ .env.example
```
# Notes on design structure
- models are isolated and already modularized.

- repositories hold raw SQLAlchemy queries (testable, reusable).

- services enforce app rules (e.g., “no guests”, “title must match role”).

- routers are thin adapters (request/response mapping).

- graphql sits beside REST, reusing services.

- alembic points to Base.metadata via app.models.

- REST endpoints live under `app/api/v1/routers`, business logic sits inside `app/services`, and data access is handled in `app/repositories`. The GraphQL API shares the same services, and Alembic migrations are configured via `migrations/env.py`.

- the full base URL for endpoints during local development becomes http://127.0.0.1:8000/api/v1 (e.g., http://127.0.0.1:8000/api/v1/workers).

- If we override the host/port flags (for example, fastapi dev app/main.py --host 0.0.0.0 --port 9000), the CLI will serve on those values instead, and the base URL updates accordingly.

## Tech Stack

Front-end: React Native, Emotion CSS library (WebApp if React Native doesn’t)
Back-end: Java, Python
Databases: PostgreSQL
API’s: FastAPI, Trulio SDK API
Additional resources: N8N Automation, Gradle Build Tool, Mermaid.js

## Tech Stack official documentation

PostgreSQL: https://www.postgresql.org/
SQLAlchemy2.0: https://docs.sqlalchemy.org/en/20/index.html#
Python: https://docs.python.org/3/
FastAPI: https://fastapi.tiangolo.com/

## Key design priciples for SQLAlquemy ORM

One-to-Many: One record in a table can be associated with multiple records in another table (e.g., one user can have many posts).
Many-to-Many: Multiple records in one table can be associated with multiple records in another table (e.g., many users can follow many other users). This often involves an intermediary "association table."
One-to-One: One record in a table is exclusively linked to one record in another table (e.g., a user might have one profile).

## Alembic & database setup

1. **Create your environment and install dependencies**
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
    This installs Alembic alongside SQLAlchemy and the PostgreSQL driver, so
   all migration commands run inside the virtual environment without relying
   on system packages.
2. **Configure the database URL** by copying the example environment file and editing if needed.
   ```bash
   cp .env.example .env
   # DATABASE_URL defaults to postgresql+psycopg2://medpost:MedPost123@localhost/medpost_dev
   ```
   The same URL is baked into `alembic.ini` and the application settings, so Alembic and the FastAPI app use the same PostgreSQL instance by default.
3. **Verify connectivity** before running migrations (optional but recommended).
   ```bash
   psql postgresql://medpost:MedPost123@localhost/medpost_dev -c "\dt"
   ```
   The command should connect without errors. An empty result set is expected on a fresh database.
4. **Run Alembic commands** from the `backend/` directory:
   ```bash
   # Generate a new revision from SQLAlchemy models (auto-detecting changes)
   alembic revision --autogenerate -m "describe your change"

   # Apply the latest migrations to the medpost_dev database
   alembic upgrade head

   # (Optional) inspect the current migration history
   alembic history --verbose
   ```
    If you see `Target database is not up to date.` when creating a new
   revision, it means there are unapplied migrations in the
   `migrations/versions/` directory. Run `alembic upgrade head` first (or
   `alembic stamp head` if you intentionally want to mark an empty database
   as up to date without applying migrations) and re-run the revision command.
5. **Regenerate the database schema** after model changes by repeating the revision/upgrade cycle above.
6. **Run the FastAPI app** and exercise CRUD APIs—both the app and Alembic sessions share the same `DATABASE_URL`, so they operate on the same PostgreSQL schema.

- user/role: medpost
- psswd: MedPost123
- Official db: medpost_dev
- DB URL: postgresql+psycopg://medpost:MedPost123@localhost:5432/medpost_dev
