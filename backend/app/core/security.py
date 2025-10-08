"""Security helpers for authentication and authorization."""

from __future__ import annotations

import datetime as dt
from typing import Any, Dict, Iterable, Optional

import jwt
from fastapi import HTTPException, status

from .settings import get_settings


class TokenPayload(Dict[str, Any]):
    """Typed helper representing decoded JWT payload."""


def decode_jwt(token: str) -> TokenPayload:
    """Decode a JWT token and return its payload."""

    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc

    exp = payload.get("exp")
    if exp is not None:
        expiration = dt.datetime.fromtimestamp(exp, tz=dt.timezone.utc)
        if expiration < dt.datetime.now(tz=dt.timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )

    return TokenPayload(payload)


def require_roles(payload: TokenPayload, allowed_roles: Iterable[str]) -> None:
    """Ensure the token payload contains one of the allowed roles."""

    roles = payload.get("roles", [])
    if isinstance(roles, str):
        roles = [roles]

    if not any(role in roles for role in allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user",
        )


def get_subject(payload: TokenPayload) -> Optional[str]:
    """Return the token subject (user identifier)."""

    sub = payload.get("sub")
    return str(sub) if sub is not None else None
