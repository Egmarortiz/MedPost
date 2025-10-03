#!/bin/bash/env python3
"""Facility FastAPI connection"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.dependencies import get_db
from app.schemas.facility import (
    FacilityCreate,
    FacilityRead,
    FacilityUpdate,
    FacilityAddressCreate,
    FacilityAddressRead,
    FacilityCertificationCreate,
    FacilityCertificationRead,
)
from app import crud

router = APIRouter(prefix="/facilities", tags=["facilities"])


@router.post("/", response_model=FacilityRead, status_code=status.HTTP_201_CREATED)
def create_facility(payload: FacilityCreate, db: Session = Depends(get_db)):
    f = crud.facility.create_facility(db, payload)
    return f


@router.get("/{facility_id}", response_model=FacilityRead)
def read_facility(facility_id: UUID, db: Session = Depends(get_db)):
    f = crud.facility.get_facility(db, facility_id)
    if not f:
        raise HTTPException(status_code=404, detail="Facility not found")
    return f


@router.get("/", response_model=List[FacilityRead])
def list_facilities(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return crud.facility.get_facilities(db, skip=skip, limit=limit)


@router.put("/{facility_id}", response_model=FacilityRead)
def update_facility(facility_id: UUID, payload: FacilityUpdate, db: Session = Depends(get_db)):
    f = crud.facility.update_facility(db, facility_id, payload)
    if not f:
        raise HTTPException(status_code=404, detail="Facility not found")
    return f


@router.delete("/{facility_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facility(facility_id: UUID, db: Session = Depends(get_db)):
    ok = crud.facility.delete_facility(db, facility_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Facility not found")
    return None


@router.post("/{facility_id}/addresses", response_model=FacilityAddressRead, status_code=status.HTTP_201_CREATED)
def add_address(facility_id: UUID, payload: FacilityAddressCreate, db: Session = Depends(get_db)):
    f = crud.facility.get_facility(db, facility_id)
    if not f:
        raise HTTPException(status_code=404, detail="Facility not found")
    addr = crud.facility.add_address(db, facility_id, payload)
    return addr


@router.get("/{facility_id}/addresses", response_model=List[FacilityAddressRead])
def list_addresses(facility_id: UUID, db: Session = Depends(get_db)):
    _ = crud.facility.get_facility(db, facility_id)
    return crud.facility.list_addresses(db, facility_id)


@router.post("/{facility_id}/certifications", response_model=FacilityCertificationRead, status_code=status.HTTP_201_CREATED)
def add_certification(facility_id: UUID, payload: FacilityCertificationCreate, db: Session = Depends(get_db)):
    f = crud.facility.get_facility(db, facility_id)
    if not f:
        raise HTTPException(status_code=404, detail="Facility not found")
    cert = crud.facility.add_certification(db, facility_id, payload)
    return cert
