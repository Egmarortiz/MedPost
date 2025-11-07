"""
Import models once so SQLAlchemy registers all mappers on Base.metadata.

This is important for:
- Base.metadata.create_all(bind=engine)
- Alembic autogenerate (env.py -> target_metadata = Base.metadata)
"""


from .base_model import (
    Base,
    VerificationStatus,
    SafetyTier,
    WorkerTitle,
    EducationLevel,
    Industry,
    FacilityCertificationCode,
    EmploymentType,
    CompensationType,
    Endorsement,
    AuthEventType,
    UserRole,
)

from .worker import Worker, Experience, SafetyCheck, CredentialType, WorkerCredential
from .facility import Facility, FacilityAddress, SpecialtyType, FacilitySpecialty, FacilityCertification
from .jobs import JobPost, JobPostRole, JobApplication
from .user import User, RefreshToken, AuthAuditLog

__all__ = [
    "Base",
    "VerificationStatus",
    "SafetyTier",
    "WorkerTitle",
    "EducationLevel",
    "Industry",
    "FacilityCertificationCode",
    "EmploymentType",
    "CompensationType",
    "Endorsement",
    "Worker",
    "Experience",
    "SafetyCheck",
    "CredentialType",
    "WorkerCredential",
    "Facility",
    "FacilityAddress",
    "SpecialtyType",
    "FacilitySpecialty",
    "FacilityCertification",
    "JobPost",
    "JobPostRole",
    "JobApplication",
    "User",
    "RefreshToken",
    "AuthAuditLog",
    "AuthEventType",
    "UserRole",
]
