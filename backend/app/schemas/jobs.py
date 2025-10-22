"""Job DTOs."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict

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


class JobPostUpdate(BaseModel):
    facility_legal_name_snapshot: Optional[str] = None
    city: Optional[PuertoRicoMunicipality] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    position_title: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    compensation_type: Optional[CompensationType] = None
    hourly_min: Optional[float] = None
    hourly_max: Optional[float] = None
    monthly_min: Optional[float] = None
    monthly_max: Optional[float] = None
    yearly_min: Optional[float] = None
    yearly_max: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None


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
    contact_phone_e164_snapshot: Optional[str] = Field(default=None, alias="phone_e164")
    contact_email_snapshot: Optional[str] = Field(default=None, alias="email")

    model_config = ConfigDict(populate_by_name=True)

class JobApplicationRead(JobApplicationCreate, APIModel):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime


class JobApplicationUpdate(BaseModel):
    answer_text: Optional[str] = None
    contact_phone_e164_snapshot: Optional[str] = Field(default=None, alias="phone_e164")
    contact_email_snapshot: Optional[str] = Field(default=None, alias="email")

    class Config:
        allow_population_by_field_name = True
