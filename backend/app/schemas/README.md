# Pydantic Schemas

The `schemas` package defines the shapes of data that flow into and out of the API.  These Pydantic models provide validation, serialization, and documentation for every request and response body.

- **common.py** contains shared mixins (timestamps, pagination, base identifiers) reused across feature schemas.
- Feature-specific modules (such as **auth.py**, **facility.py**, **worker.py**, **jobs.py**, **endorsement.py**, **filters.py**) describe the inputs controllers accept and the DTOs returned to clients.

Schemas sit between FastAPI routers and service logic: routers parse incoming JSON into schema objects, services operate on them, and responses are rendered back to the client using the same definitions.
