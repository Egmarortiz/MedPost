#!/usr/bin/env python3
"""Job posts schemas"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, HttpUrl
from enum import Enum

# Enum, list of selections
class EmploymentType(str, Enum):
    FULL_TIME = "FULL TIME"
    PART_TIME = "PART TIME"

class CompensantionType(str, Enum):
    HOURLY = "HOURLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

class WorkerTitle(str, Enum):
    RN = "REGISTERED NURSE"
    LPN = "LICENSED PRACTICAL NURSE"
    CNA = "CERTIFIED NURSING ASSISTANT"
    CAREGIVER = "CAREGIVER"
    SUPPORT = "SUPPORT"

class ApplicationStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    REVIEWED = "REVIEWED"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    HIRED = "HIRED"

# Job role schema
class JobPostRoleBase(BaseModel):
        role: WorkerTitle

class JobPostRoleCreate(JobPostRoleBase):
     pass

class JobPostRole(JobPostRoleBase):
     id: UUID

     class Config:
          orm_mode = True

# Job post schemas
class JobPostBase(BaseModel):
     position_title: str
     employment_type: EmploymentType
     compensation_type: CompensantionType
     description: str
     city: str
     state_province: str
     postal_code: str
     hourly_min: Optional[float] = None
     hourly_max:  Optional[float] = None
     monthly_min:  Optional[float] = None
     monthly_max:  Optional[float] = None
     yearly_min:  Optional[float] = None
     yearly_max:  Optional[float] = None
     is_active:  Optional[bool] = None

class JobPostCreate(JobPostBase):
     facility_id: UUID

class JobPostUpdate(BaseModel):
     position_title: Optional[str] = None
     description: Optional[str] = None
     is_active:  Optional[bool] = None

class JobPost(JobPostBase):
    id: UUID
    facility_id: UUID
    published_at: Optional[datetime]
    closed_at: Optional[datetime]
    roles: List[JobPostRole] = []

    class Config:
        orm_mode = True

# Job application schemas
class JobApplicationBase(BaseModel):
    answer_text: Optional[str] = None
    phone_e164: Optional[str] = None
    email: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    job_post_id: UUID
    worker_id: Optional[UUID] = None

class JobApplication(JobApplicationBase):
    id: UUID
    status: ApplicationStatus
    created_at: datetime

    class Config:
        orm_mode = True
