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

class CompensationType(str, Enum):
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
          from_attributes = True

# Job post schemas
from pydantic import field_validator

class JobPostBase(BaseModel):
    position_title: str
    employment_type: str
    compensation_type: CompensationType
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

    # Convert employment type from frontend format (spaces) to database format (underscores)
    @field_validator('employment_type', mode='before') 
    @classmethod
    def normalize_employment_type(cls, v):
        if isinstance(v, str):
            # Convert spaces to underscores for database compatibility
            if v == "FULL TIME":
                return "FULL_TIME"
            elif v == "PART TIME":
                return "PART_TIME"
            # Already in underscore format
            return v
        return v

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

    class Config:
        from_attributes = True

# Job application schemas
class JobApplicationBase(BaseModel):
    answer_text: Optional[str] = None
    phone_e164: Optional[str] = None
    email: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    job_post_id: UUID
    worker_id: Optional[UUID] = None

class JobApplicationUpdate(BaseModel):
    answer_text: Optional[str] = None
    phone_e164: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None

class JobApplicationRead(JobApplicationBase):
    id: UUID
    job_post_id: UUID
    worker_id: Optional[UUID] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class JobApplication(JobApplicationBase):
    id: UUID
    status: ApplicationStatus
    created_at: datetime

    class Config:
        from_attributes = True
