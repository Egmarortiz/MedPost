"""Database seed helpers."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import SpecialtyType, CredentialType

DEFAULT_CREDENTIAL_TYPES = (
    ("RN_LICENSE", "Registered Nurse License"),
    ("CNA_CERT", "Certified Nursing Assistant"),
    ("BLS", "Basic Life Support"),
    ("ACLS", "Advanced Cardiovascular Life Support"),
    ("PALS", "Pediatric Advanced Life Support"),
)

DEFAULT_SPECIALTIES = (
    ("CRITICAL_CARE", "Critical Care"),
    ("GERIATRICS", "Geriatrics"),
)


def seed_reference_data(db: Session) -> None:
    """Seed lookup tables if they are empty."""

    if not db.query(CredentialType).first():
        for code, label in DEFAULT_CREDENTIAL_TYPES:
            db.add(CredentialType(code=code, label=label))

    if not db.query(SpecialtyType).first():
        for code, label in DEFAULT_SPECIALTIES:
            db.add(SpecialtyType(code=code, label=label))

    db.commit()
