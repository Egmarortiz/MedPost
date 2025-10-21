"""Business logic for facilities."""

from __future__ import annotations

from typing import List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Facility
from app.repositories import FacilityRepository
from app.schemas import (
    FacilityCertificationRead,
    FacilityCreate,
    FacilityFilter,
    FacilityUpdate,
    FacilityWithCertifications,
    PaginationParams,
)


class FacilitiesService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = FacilityRepository(session)

    def list_facilities(
        self, filters: FacilityFilter, pagination: PaginationParams
    ) -> Tuple[List[Facility], int]:
        return self.repo.list_facilities(filters, pagination)

    def get_facility(self, facility_id: UUID) -> Facility | None:
        return self.repo.get_facility(facility_id)

    def create_facility(self, payload: FacilityCreate) -> Facility:
        facility = Facility(**payload.dict(exclude_unset=True))
        self.repo.add(facility)
        self.session.commit()
        self.session.refresh(facility)
        return facility

    def update_facility(self, facility_id: UUID, payload: FacilityUpdate) -> Facility | None:
        facility = self.repo.get_facility(facility_id)
        if not facility:
            return None
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(facility, key, value)
        self.session.commit()
        self.session.refresh(facility)
        return facility

    def delete_facility(self, facility_id: UUID) -> bool:
        facility = self.repo.get_facility(facility_id)
        if not facility:
            return False
        self.repo.delete(facility)
        self.session.commit()
        return True

    def get_facility_with_certifications(self, facility_id: UUID) -> FacilityWithCertifications | None:
        facility = self.repo.get_facility(facility_id)
        if not facility:
            return None
        certifications = self.repo.list_certifications(facility_id)
        cert_schemas = [FacilityCertificationRead.from_orm(cert) for cert in certifications]
        return FacilityWithCertifications.from_orm(facility).copy(
            update={"certifications": cert_schemas}
        )
