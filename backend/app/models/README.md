# ORM Models

The `models` package defines the database schema in Python.  Every class here is a SQLAlchemy model that maps to a PostgreSQL table and captures MedPost's domain entities.

- **base_model.py** declares shared mixins (timestamps, primary key, `__repr__`) and exposes the declarative `Base` metadata used by migrations.
- **facility.py**, **worker.py**, **jobs.py**, and **user.py** describe the core tables and their relationships (foreign keys, backrefs, enumerations).

These classes are imported by repositories for querying and by Alembic migrations to generate schema changes.  Keeping them together provides a single source of truth for the persistent domain model.
