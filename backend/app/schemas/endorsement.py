"""Pydantic schemas for endorsements."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from .common import APIModel


class EndorsementBase(APIModel):
    note: Optional[str] = None
    has_badge: bool = True


class EndorsementCreate(EndorsementBase):
    worker_id: UUID


class EndorsementUpdate(APIModel):
    note: Optional[str] = None
    has_badge: Optional[bool] = None


class EndorsementRead(EndorsementBase):
    id: UUID
    worker_id: UUID
    facility_id: UUID

    model_config = APIModel.model_config
