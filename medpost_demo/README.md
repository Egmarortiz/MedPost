## Testing tools and structure

```
medpost_demo/
├─ app/
│  ├─ __init__.py            # marks app as a package
│  ├─ db.py                  # DB engine + SessionLocal factory (uses DATABASE_URL)
│  ├─ models.py              # SQLAlchemy ORM classes (source of truth for schema)
│  ├─ schemas.py             # Pydantic models for API I/O (FastAPI)
│  ├─ deps.py                # FastAPI dependency: yields/cleans up DB sessions
│  ├─ main.py                # FastAPI app with CRUD endpoints (optional)
│  ├─ seed.py                # Writes example rows (persists data)
│  ├─ query.py               # Reads rows back (sanity check)
│  └─ crud_demo.py           # Example update/delete via Session
├─ migrations/
│  ├─ env.py                 # Alembic environment: wires models → autogenerate
│  ├─ script.py.mako         # Template Alembic uses to create new revisions
│  └─ versions/
│     └─ <rev>_*.py          # Migration scripts (upgrade()/downgrade())
├─ alembic.ini               # Alembic config (script_location + sqlalchemy.url)
├─ requirements.txt          # Python deps
├─ .env.example              # Sample env file with DATABASE_URL
└─ venv/
```

