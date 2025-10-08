"""Database session helpers."""

from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core import get_settings


_ENGINE = create_engine(
    get_settings().database_url,
    future=True,
)
_SessionLocal = sessionmaker(bind=_ENGINE, expire_on_commit=False, class_=Session)


def get_engine():  # pragma: no cover - thin wrapper
    return _ENGINE


def get_session_factory():  # pragma: no cover
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""

    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""

    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
