# Core Utilities

The `core` package collects helpers that every part of the application depends on.  Keeping these cross-cutting concerns in one place prevents circular imports and clarifies which modules are safe to use from anywhere.

- **settings.py** centralizes configuration via Pydantic `BaseSettings`, reading environment variables for secrets, CORS, database URLs, and other runtime toggles.
- **security.py** provides password hashing, token creation, and JWT verification utilities shared across authentication flows.
- **locations.py** exposes geographic constants and lookup helpers that support both services and schemas.

These modules are imported throughout the API, services, and repositories to ensure the entire stack shares consistent configuration and security behavior.
