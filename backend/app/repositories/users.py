"""Repositories for authentication models."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models import AuthAuditLog, RefreshToken, User
from .base import SQLAlchemyRepository


class UserRepository(SQLAlchemyRepository[User]):
    def __init__(self, session: Session):
        super().__init__(User, session)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(func.lower(User.email) == func.lower(email))
        return self.session.execute(stmt).scalars().first()

    def set_last_login(self, user: User) -> None:
        self.session.execute(
            update(User).where(User.id == user.id).values(last_login_at=func.now())
        )


class RefreshTokenRepository(SQLAlchemyRepository[RefreshToken]):
    def __init__(self, session: Session):
        super().__init__(RefreshToken, session)

    def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.session.execute(stmt).scalars().first()


class AuthAuditLogRepository(SQLAlchemyRepository[AuthAuditLog]):
    def __init__(self, session: Session):
        super().__init__(AuthAuditLog, session)

