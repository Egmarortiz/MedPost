# API v1 Boundary

The `v1` package groups every endpoint that belongs to the first version of the MedPost public API.  It gives the team a stable namespace (`/api/v1`) while leaving room to introduce `/api/v2` or experimental releases later without breaking existing clients.

- **routers/** organizes feature-specific FastAPI routers (authentication, facilities, jobs, workers, endorsements).  Each router maps HTTP verbs and paths to service calls and enforces the appropriate dependencies.
- `__init__.py` exposes a single `api_router` that is included by `main.py`, keeping the application entry point lightweight.

When a request hits `/api/v1/...`, it is routed through these modules before reaching the service layer.
