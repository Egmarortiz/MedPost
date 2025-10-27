# Database Access Layer

The `db` package is the glue between SQLAlchemy models and the PostgreSQL server.  It exposes utilities that other layers import instead of touching engine details directly.

- **session.py** builds the SQLAlchemy engine and `SessionLocal` factory using settings from `core.settings`, and provides dependency helpers for FastAPI routes.
- **init_db.py** runs one-time bootstrap tasks (such as creating an initial superuser or seeding reference data) when the application starts.
- `__init__.py` exposes convenience imports so other modules can simply write `from app.db import get_db`.

By centralizing connection management here, services and repositories can focus on business queries while sharing a single, well-configured database session lifecycle.

# MedPost Database Operations Guide

Here is a plug-and-play checklist for connecting to the MedPost PostgreSQL database, inspecting schemas and tables, querying data safely, and avoiding common pitfalls.

---

## 1. Prerequisites

* **psql client** – install with `apt-get install postgresql-client`, `brew install libpq`, or your OS equivalent.
* **Credentials** – username, database name, host, port, and (optionally) password for the environment you are targeting.

> **Tip:** Use a least-privileged role such as `medpost` for day-to-day operations, reserving superuser (`postgres`) access for administrative tasks.

---

## 2. Connect to PostgreSQL

Export connection settings and launch `psql` in one command:

```bash
PGUSER=medpost \
PGDATABASE=medpost_dev \
PGHOST=localhost \
PGPORT=5432 \
psql
```

* Add `PGPASSWORD=...` if the role requires a password.
* Inside `psql`, run `\conninfo` any time to confirm the active role, database, host, and SSL mode.
* To exit `psql`, type `\q`.

---

## 3. Discover Databases and Schemas

While inside `psql`:

| Purpose | Command |
|---------|---------|
| List all databases | `\l` |
| Switch to the MedPost database | `\c medpost` |
| Show schemas | `\dn` |
| Show current search path | `SHOW search_path;` |

> **Reminder:** If tables appear missing, explicitly set the search path: `SET search_path TO public, medpost;` (adjust as needed).

---

## 4. Inspect Tables and Columns

Use these commands once you are connected to the correct database and schema:

| Need | Command |
|------|---------|
| List tables in the active schema | `\dt` |
| List tables in a specific schema | `\dt schema_name.*` |
| Describe a table (columns, indexes) | `\d table_name` |
| Describe a table with size/defaults | `\d+ table_name` |

---

## 5. View Table Contents Safely

```sql
-- Preview a handful of rows
SELECT * FROM app_user LIMIT 20;
```

---

## 5. Quick Reference Cheat Sheet

```text
psql ...                 # open client
\conninfo                # confirm connection
\l                       # list databases
\c medpost               # switch database
\dn                      # list schemas
\dt                      # list tables
\d table                 # describe table
SELECT ... LIMIT 20;     # sample data
\pset pager on           # enable pager
\q                       # quit
```

Share this guide with teammates so everyone follows the same safe, repeatable flow for MedPost database management.
