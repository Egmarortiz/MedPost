# MedPost

## Minimal architecture design

```
[Expo App (JS) on Device]
        |
        |  HTTPS (fetch / Apollo)
        v
[FastAPI App (REST)]
        |
        |  SQLAlchemy ORM
        v
   [PostgreSQL DB]
        ^
        |  Alembic CLI (migrate up/down) — runs on server/CI, NOT the app
```
