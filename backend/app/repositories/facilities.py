"""Facility repository."""

from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Facility, FacilityCertification, FacilityCertificationCode
from app.schemas import FacilityFilter, PaginationParams
from .base import SQLAlchemyRepository


class FacilityRepository(SQLAlchemyRepository[Facility]):
    def __init__(self, session: Session):
        super().__init__(Facility, session)

    def get_facility(self, facility_id: UUID) -> Optional[Facility]:
        return self.session.get(Facility, facility_id)

    def get_by_user_id(self, user_id: UUID) -> Optional[Facility]:
        stmt = select(Facility).where(Facility.user_id == user_id)
        return self.session.execute(stmt).scalars().first()

    def list_certifications(self, facility_id: UUID) -> List[FacilityCertification]:
        stmt = select(FacilityCertification).where(
            FacilityCertification.facility_id == facility_id
        )
        return self.session.execute(stmt).scalars().all()

    def get_certification_by_code(
        self, facility_id: UUID, code: FacilityCertificationCode
    ) -> Optional[FacilityCertification]:
        stmt = select(FacilityCertification).where(
            FacilityCertification.facility_id == facility_id,
            FacilityCertification.code == code,
        )
        return self.session.execute(stmt).scalars().first()

    def add_certification(self, certification: FacilityCertification) -> FacilityCertification:
        self.session.add(certification)
        self.session.flush()
        return certification

    def list_facilities(
        self, filters: FacilityFilter, params: Optional[PaginationParams] = None
    ) -> Tuple[List[Facility], int]:
        stmt = select(Facility)
        if filters.industry:
            stmt = stmt.where(Facility.industry == filters.industry)
        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.execute(total_stmt).scalar_one()
        query = stmt
        if params:
            query = query.offset(params.offset).limit(params.limit)
        facilities = self.session.execute(query).scalars().all()
        return facilities, total
