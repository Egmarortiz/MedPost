"""Strawberry GraphQL types."""

from __future__ import annotations

import datetime as dt
from typing import Optional
from uuid import UUID

import strawberry


@strawberry.type
class WorkerType:
    id: UUID
    full_name: str
    title: str
    city: Optional[str]
    state_province: Optional[str]
    created_at: dt.datetime


@strawberry.type
class FacilityType:
    id: UUID
    legal_name: str
    industry: str
    city: Optional[str]
    state_province: Optional[str]
    is_verified: bool


@strawberry.type
class JobPostType:
    id: UUID
    position_title: str
    city: Optional[str]
    state_province: Optional[str]
    employment_type: str
    compensation_type: str
    is_active: bool
