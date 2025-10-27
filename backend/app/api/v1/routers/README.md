# Feature Routers

This directory holds the FastAPI routers that expose MedPost's domain features.  Each file registers a `APIRouter` with path operations focused on a single concern and delegates real work to the service layer.

- **auth.py** – Login, token refresh, and user session management endpoints.
- **facilities.py** – CRUD and search APIs for healthcare facilities.
- **facility_certifications.py** – Certification management endpoints associated with facilities.
- **jobs.py** – Job posting and assignment endpoints.
- **endorsements.py** – Endorsement workflow APIs tying workers to facilities.
- **workers.py** – Worker profile, availability, and credential endpoints.

# End-to-end JWT auth system (modern)

1. User logs in with email/password
    → AuthService issues:
         - access_token (expires in 15 min)
         - refresh_token (expires in 7 days, stored in DB)

2. User calls API with access_token
    → FastAPI middleware validates signature & expiration

3. Token expires
    → Client sends refresh_token to /refresh endpoint
    → AuthService checks DB:
         - token not revoked?
         - token not expired?
         - token matches user?
    → Issues new access_token

4. User logs out (or admin revokes)
    → Refresh token entry marked revoked in DB

5. Audit rows
    → Every step (login, refresh, logout, revoke) is logged.

Routers combine request schemas, dependencies from `api/deps.py`, and service calls so that HTTP concerns remain isolated from business logic and data access code.
