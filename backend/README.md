## File structure
```
backend/
├── README.md
├── alembic.ini                  # Alembic configuration pointing at app.models.Base
├── requirements.txt             # Backend runtime + tooling dependencies
├── migrations/                  # Database migration environment
│   ├── env.py                   # Alembic environment wired to SQLAlchemy metadata
│   ├── script.py.mako           # Alembic revision template
│   └── versions/                # Auto-generated & handwritten revision files
└── app/
    ├── __init__.py
    ├── main.py                  # FastAPI app factory that mounts the REST API
    ├── core/                    # Cross-cutting concerns & configuration
    │   ├── __init__.py
    │   ├── locations.py         # Canonical state/country lookups used in validation
    │   ├── security.py          # JWT helpers, password hashing, role utilities
    │   └── settings.py          # Pydantic BaseSettings (DB URL, CORS, secrets)
    ├── db/                      # Database bootstrapping helpers
    │   ├── __init__.py
    │   ├── init_db.py           # Seed routines for reference data (credentials, specialties)
    │   └── session.py           # Engine, SessionLocal factory, FastAPI dependency
    ├── models/                  # SQLAlchemy ORM models & metadata registration
    │   ├── __init__.py          # Imports model modules so Alembic discovers mappers
    │   ├── base_model.py        # Declarative Base, mixins, common enums
    │   ├── facility.py
    │   ├── jobs.py
    │   ├── user.py
    │   └── worker.py
    ├── repositories/            # Raw data-access layer (SQLAlchemy queries only)
    │   ├── __init__.py
    │   ├── base.py              # Generic CRUD helpers shared by concrete repositories
    │   ├── endorsements.py
    │   ├── facilities.py
    │   ├── jobs.py
    │   ├── users.py
    │   └── workers.py
    ├── schemas/                 # Pydantic request/response contracts
    │   ├── __init__.py
    │   ├── auth.py
    │   ├── common.py            # Shared enums, pagination, and response wrappers
    │   ├── endorsement.py
    │   ├── facility.py
    │   ├── filters.py           # Filtering payloads used by listing endpoints
    │   ├── jobs.py
    │   └── worker.py
    ├── services/                # Domain logic orchestrating repositories & policies
    │   ├── __init__.py
    │   ├── auth_service.py
    │   ├── endorsements_service.py
    │   ├── facilities_service.py
    │   ├── jobs_service.py
    │   └── workers_service.py
    └── api/                     # FastAPI routers and dependency wiring
        ├── __init__.py
        ├── deps.py              # Dependency providers (DB session, auth, pagination)
        └── v1/
            ├── __init__.py
            └── routers/         # Versioned REST endpoints exposing services
                ├── __init__.py
                ├── auth.py
                ├── endorsements.py
                ├── facilities.py
                ├── facility_certifications.py
                ├── jobs.py
                └── workers.py
```
# Notes on design structure
- Models are isolated and modularised so Alembic can import a single `app.models` package and discover all table mappings automatically.

- Repositories hold raw SQLAlchemy queries (testable, reusable) and expose a thin CRUD interface to the rest of the app.

- Services enforce business rules (licensing checks, role rules, application flows) and orchestrate multiple repositories.

- Routers are transport adapters: they validate requests with Pydantic schemas, call services, and translate results back into responses.- graphql sits beside REST, reusing services.

- Alembic resolves metadata from `app.models.base_model.Base`, keeping migrations in sync with ORM models via the `migrations/env.py` bridge.

- Versioned REST endpoints live under `app/api/v1/routers`, business logic sits inside `app/services`, and data access is handled in `app/repositories`.

- The default base URL for local development is http://127.0.0.1:8000/api/v1 (for example, http://127.0.0.1:8000/api/v1/workers). Overriding `--host`/`--port` when launching FastAPI updates the base URL accordingly.


## Tech Stack

- Front-end: React Native, Emotion CSS library

- Back-end: Python, SQLAlchemy ORM, Alembic migration

- Databases: PostgreSQL

- API’s: FastAPI

- Additional resources: N8N Automation, Mermaid.js

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

