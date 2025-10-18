"""Facility REST endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.schemas import (
    FacilityCreate,
    FacilityRead,
    FacilityUpdate,
    PaginatedResponse,
)
from app.api.deps import get_facilities_service, get_pagination_params
from app.schemas.common import PaginationParams
from app.services.facilities_service import FacilitiesService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[FacilityRead])
def list_facilities(
    pagination: PaginationParams = Depends(get_pagination_params),
    service: FacilitiesService = Depends(get_facilities_service),
) -> PaginatedResponse[FacilityRead]:
    facilities, total = service.list_facilities(pagination)
    items = [FacilityRead.from_orm(facility) for facility in facilities]
    return PaginatedResponse[FacilityRead](
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.post("/", response_model=FacilityRead, status_code=status.HTTP_201_CREATED)
def create_facility(
    payload: FacilityCreate,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    facility = service.create_facility(payload)
    return FacilityRead.from_orm(facility)


@router.get("/{facility_id}", response_model=FacilityRead)
def get_facility(
    facility_id: UUID,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    facility = service.get_facility(facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return FacilityRead.from_orm(facility)


@router.patch("/{facility_id}", response_model=FacilityRead)
def update_facility(
    facility_id: UUID,
    payload: FacilityUpdate,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    facility = service.update_facility(facility_id, payload)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return FacilityRead.from_orm(facility)

@router.delete("/{facility_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facility(
    facility_id: UUID,
    service: FacilitiesService = Depends(get_facilities_service),
) -> Response:
    deleted = service.delete_facility(facility_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
