#!/usr/bin/env python3
"""Create all database tables."""

from app.db.session import get_engine
from app.models.base_model import Base

# Import all models to ensure they're registered
from app.models import (
    User,
    Worker,
    Facility,
    RefreshToken,
    Experience,
    WorkerCredential,
    CredentialType,
    SpecialtyType,
    Endorsement,
    SafetyCheck,
    JobPost,
    JobPostRole,
    JobApplication,
    FacilityAddress,
    FacilityCertification,
)

def create_tables():
    """Create all tables in the database."""
    print("Creating all tables...")
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("All tables created successfully!")

if __name__ == "__main__":
    create_tables()
