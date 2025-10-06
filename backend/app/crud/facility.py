#!/bin/bash/env python3
"""Facility CRUD functions"""

from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.facility import (
    Facility,
    FacilityAddress,
    FacilityCertification,
    FacilitySpecialty,
)
from app.schemas.facility import (
    FacilityCreate,
    FacilityUpdate,
    FacilityAddressCreate,
    FacilityCertificationCreate,
)

def create_facility(db: Session, paylod: FacilityCreate) -> Facility:
    db_obj = Facility(**payload.dict(exclude_unset=True))
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_facility(db: Session, facility_id: UUID) -> Optional[Facility]:
    return db.get(Facility, facility_id)

def get_facilities(db: Session, skip: int = 0, limit: int = 50) -> List[Facility]:
    stmt = select(Facility).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()

def update_facility(db: Session, facility_id: UUID, payload: FacilityUpdate) -> Optional[Facility]:
    db_obj = get_facility(db, facility_id)
    if not db_obj:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(db_obj, k, v)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_facility(db: Session, facility_id: UUID) -> bool:
    db_obj = get_facility(db, facility_id)
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True

def add_address(db: Session, facility_id: UUID, payload:FacilityAddressCreate) -> FacilityAddress:
    addr = FacilityAddress(facility_id=facility_id, **payload.dict(exclude_unset=True))
    db.add(addr)
    return addr

def list_addresses(db: Session, facility_id: UUID, payload: FacilityCertificationCreate):
    cert = FacilityCertification(facility_id=facility_id, code=payload.code, evidence_url=payload.evidence_url)
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert

def list_certifications(db: Session, facility_id: UUID) -> List[FacilityCertification]:
    stmt = select(FacilityCertification).where(FacilityCertification.facility_id == facility_id)
    return db.execute(stmt).scalars().all()
