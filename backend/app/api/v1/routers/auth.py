"""Authentication endpoints (placeholder)."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas import TokenPayload

router = APIRouter()


@router.post("/login", response_model=TokenPayload)
def login(form_data: OAuth2PasswordRequestForm = Depends()) -> TokenPayload:
    """Return a dummy JWT token.

    This placeholder implementation allows the frontend to start wiring up
    authentication flows without a full identity provider.
    """

    expires_at = dt.datetime.utcnow() + dt.timedelta(hours=1)
    return TokenPayload(access_token=f"fake-token-for-{form_data.username}", expires_at=expires_at)
