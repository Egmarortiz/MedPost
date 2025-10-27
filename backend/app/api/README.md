# API Layer

The `api` package defines how external clients interact with the MedPost backend.  It groups FastAPI routers, shared dependency providers, and versioned route collections.

- **deps.py** centralizes reusable dependency functions (database session injection, authentication guards, pagination helpers) so routers can stay declarative.
- **v1/** contains the first public surface of the API.  Additional versions can be added alongside it to evolve the contract without breaking existing consumers.

Together these modules translate HTTP requests into typed service calls, enforce authentication/authorization, and serialize the responses that leave the system.
