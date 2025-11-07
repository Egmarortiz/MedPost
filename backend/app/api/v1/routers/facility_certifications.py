"""Facility certification REST endpoints."""

from __future__ import annotations

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_facilities_service, require_any_role, require_role
from app.core.security import TokenPayload, get_subject
from app.models import UserRole
from app.schemas import FacilityCertificationCreate, FacilityCertificationRead
from app.services.facilities_service import (
    FacilityCertificationExists,
    FacilitiesService,
)

router = APIRouter()

FacilityUser = Annotated[TokenPayload, Depends(require_role(UserRole.FACILITY.value))]
FacilityOrWorker = Annotated[
    TokenPayload,
    Depends(require_any_role(UserRole.FACILITY.value, UserRole.WORKER.value)),
]


def _get_facility_id(service: FacilitiesService, payload: TokenPayload) -> UUID:
    subject = get_subject(payload)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    try:
        user_id = UUID(str(subject))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication token",
        ) from exc

    facility = service.get_facility_for_user(user_id)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Facility profile not found",
        )
    return facility.id


@router.get("/facilities/{facility_id}", response_model=List[FacilityCertificationRead])
def list_certifications(
    facility_id: UUID,
    _: FacilityOrWorker,
    service: FacilitiesService = Depends(get_facilities_service),
) -> List[FacilityCertificationRead]:
    certifications = service.list_certifications(facility_id)
    if certifications is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return [FacilityCertificationRead.from_orm(cert) for cert in certifications]


@router.post("/", response_model=FacilityCertificationRead, status_code=status.HTTP_201_CREATED)
def create_certification(
    payload: FacilityCertificationCreate,
    current_user: FacilityUser,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityCertificationRead:
    facility_id = _get_facility_id(service, current_user)
    try:
        certification = service.create_certification(facility_id, payload)
    except FacilityCertificationExists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Certification has already been submitted for this facility",
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")

    return FacilityCertificationRead.from_orm(certification)
