"""Authentication DTOs."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .common import APIModel


class TokenPayload(APIModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: Optional[datetime] = None


class LoginRequest(BaseModel):
    username: str
    password: str
