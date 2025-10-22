"""Business logic for facilities."""

from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Facility, FacilityCertification, VerificationStatus
from app.repositories import FacilityRepository
from app.schemas import (
    FacilityCertificationCreate,
    FacilityCertificationRead,
    FacilityCreate,
    FacilityFilter,
    FacilityUpdate,
    FacilityWithCertifications,
    PaginationParams,
)

class FacilityCertificationAlreadyExistsError(Exception):
    """Raised when attempting to create a duplicate certification."""


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

    def get_facility_for_user(self, user_id: UUID) -> Facility | None:
        return self.repo.get_by_user_id(user_id)

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

    def list_certifications(
        self, facility_id: UUID
    ) -> Optional[List[FacilityCertification]]:
        facility = self.repo.get_facility(facility_id)
        if not facility:
            return None
        return self.repo.list_certifications(facility_id)

    def create_certification(
        self, facility_id: UUID, payload: FacilityCertificationCreate
    ) -> FacilityCertification:
        facility = self.repo.get_facility(facility_id)
        if not facility:
            raise ValueError("Facility not found")

        if self.repo.get_certification_by_code(facility_id, payload.code):
            raise FacilityCertificationAlreadyExistsError

        certification = FacilityCertification(
            facility_id=facility_id,
            code=payload.code,
            evidence_url=str(payload.evidence_url),
            status=VerificationStatus.PENDING,
        )
        self.repo.add_certification(certification)
        self.session.commit()
        self.session.refresh(certification)
        return certification

    def get_facility_with_certifications(self, facility_id: UUID) -> FacilityWithCertifications | None:
        facility = self.repo.get_facility(facility_id)
        if not facility:
            return None
        certifications = self.repo.list_certifications(facility_id)
        cert_schemas = [FacilityCertificationRead.from_orm(cert) for cert in certifications]
        return FacilityWithCertifications.from_orm(facility).copy(
            update={"certifications": cert_schemas}
        )
