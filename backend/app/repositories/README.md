# Repository Layer

Repositories wrap SQLAlchemy sessions with focused query logic so that services and routers do not speak raw SQL.  Each module corresponds to a major aggregate in the system and exposes functions or classes for reading and mutating data.

- **base.py** defines shared CRUD helpers (create, list, filter) and establishes the interface concrete repositories extend.
- Feature-specific modules (e.g., **facilities.py**, **workers.py**, **jobs.py**, **users.py**, **endorsements.py**) build on the base helpers to express domain-specific queries.

By funneling all database access through repositories, the project keeps persistence concerns isolated and makes it easier to swap implementations or add caching later.
