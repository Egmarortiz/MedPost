## End-to-end JWT auth system (modern)

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
