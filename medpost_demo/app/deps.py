from typing import Generator
from app.db import SessionLocal

# File connects to the same db URL we are using to migrate models
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
