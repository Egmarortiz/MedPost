"""Common FastAPI dependcencies."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import TokenPayload, decode_jwt, require_roles
from app.db.session import get_db
from app.schemas import PaginationParams
from app.services import (
    AuthService,
    EndorsementsService,
    FacilitiesService,
    JobsService,
    WorkersService,
)

OAuth2Scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/worker/login")


def get_pagination_params(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PaginationParams:
    return PaginationParams(limit=limit, offset=offset)

def get_current_user(token: Annotated[str, Depends(OAuth2Scheme)]) -> TokenPayload:
    return decode_jwt(token)


def get_workers_service(db: Annotated[Session, Depends(get_db)]) -> WorkersService:
    return WorkersService(db)


def get_facilities_service(db: Annotated[Session, Depends(get_db)]) -> FacilitiesService:
    return FacilitiesService(db)


def get_jobs_service(db: Annotated[Session, Depends(get_db)]) -> JobsService:
    return JobsService(db)


def get_auth_service(db: Annotated[Session, Depends(get_db)]) -> AuthService:
    return AuthService(db)


def get_endorsements_service(
    db: Annotated[Session, Depends(get_db)]
) -> EndorsementsService:
    return EndorsementsService(db)


def require_role(role: str):
    def dependency(payload: Annotated[TokenPayload, Depends(get_current_user)]):
        require_roles(payload, [role])
        return payload

    return dependency

def require_any_role(*roles: str):
    def dependency(payload: Annotated[TokenPayload, Depends(get_current_user)]):
        require_roles(payload, roles)
        return payload

    return dependency
