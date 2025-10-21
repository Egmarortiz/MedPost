"""Job DTOs."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.core import DEFAULT_STATE_PROVINCE, PuertoRicoMunicipality
from .common import APIModel
from app.models import CompensationType, EmploymentType, WorkerTitle

class JobPostBase(BaseModel):
    facility_id: UUID
    facility_legal_name_snapshot: Optional[str] = None
    city: Optional[PuertoRicoMunicipality] = None
    state_province: Optional[str] = DEFAULT_STATE_PROVINCE
    postal_code: Optional[str] = None
    position_title: str
    employment_type: EmploymentType
    compensation_type: CompensationType
    hourly_min: Optional[float] = None
    hourly_max: Optional[float] = None
    monthly_min: Optional[float] = None
    monthly_max: Optional[float] = None
    yearly_min: Optional[float] = None
    yearly_max: Optional[float] = None
    description: Optional[str] = None


class JobPostCreate(JobPostBase):
    pass


class JobPostRead(JobPostBase, APIModel):
    id: UUID
    is_active: bool
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None


class JobPostRoleRead(APIModel):
    id: UUID
    job_post_id: UUID
    role: WorkerTitle


class JobPostWithRoles(JobPostRead):
    roles: List[JobPostRoleRead] = Field(default_factory=list)


class JobApplicationCreate(BaseModel):
    job_post_id: Optional[UUID] = None
    worker_id: Optional[UUID] = None
    answer_text: Optional[str] = None
    phone_e164: Optional[str] = None
    email: Optional[str] = None

class JobApplicationRead(JobApplicationCreate, APIModel):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
