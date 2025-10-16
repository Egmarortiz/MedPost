"""Facility repository."""

from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Facility, FacilityCertification
from app.schemas import PaginationParams
from .base import SQLAlchemyRepository


class FacilityRepository(SQLAlchemyRepository[Facility]):
    def __init__(self, session: Session):
        super().__init__(Facility, session)

    def get_facility(self, facility_id: UUID) -> Optional[Facility]:
        return self.session.get(Facility, facility_id)

    def list_certifications(self, facility_id: UUID) -> List[FacilityCertification]:
        stmt = select(FacilityCertification).where(
            FacilityCertification.facility_id == facility_id
        )
        return self.session.execute(stmt).scalars().all()

    def list_facilities(
        self, params: Optional[PaginationParams] = None
    ) -> Tuple[List[Facility], int]:
        stmt = select(Facility)
        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.execute(total_stmt).scalar_one()
        if params:
            stmt = stmt.offset(params.offset).limit(params.limit)
        facilities = self.session.execute(stmt).scalars().all()
        return facilities, total
