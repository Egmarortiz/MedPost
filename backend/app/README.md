# MedPost Backend Application Layer

This package contains the FastAPI application that powers the MedPost backend.  It is organized as a set of focused directories so the responsibilities of configuration, data access, business logic, and HTTP delivery stay separated.  The `main.py` module creates the FastAPI instance, wires together the dependencies described below, and exposes the ASGI app that is run by the server process.

At a glance, the key layers are:

- **api/** – FastAPI routers, dependency wiring, and API versioning boundaries.
- **core/** – Application-wide configuration, security helpers, and other cross-cutting utilities.
- **db/** – Database session management and startup routines for connecting to PostgreSQL.
- **models/** – SQLAlchemy ORM models that describe the persistence schema.
- **repositories/** – Data access objects that encapsulate read/write queries.
- **schemas/** – Pydantic request/response contracts shared by the API and services.
- **services/** – Business workflows that orchestrate repositories, models, and external integrations.

Understanding how these directories collaborate provides the mental map for following a request as it moves from the HTTP layer through domain logic and finally to the database.
