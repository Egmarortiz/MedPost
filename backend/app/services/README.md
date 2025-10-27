## Service Layer

Services contain the business rules that coordinate repositories, schemas, and external integrations.  A service module typically receives validated schema objects from a router, runs domain logic, and returns results ready for serialization.

- **auth_service.py** – Handles credential validation, token issuance, and refresh workflows by combining repositories and security utilities.
- **facilities_service.py** / **workers_service.py** – Encapsulate facility and worker business processes, including eligibility rules and cross-entity coordination.
- **jobs_service.py** – Orchestrates job posting lifecycle, matching workers to facilities, and updating statuses.
- **endorsements_service.py** – Manages endorsement creation and validation between workers and facilities.

Keeping business logic in services ensures HTTP handlers stay thin and repositories remain focused on persistence.
