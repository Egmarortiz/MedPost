"""Endorsement repository."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Endorsement
from .base import SQLAlchemyRepository


class EndorsementRepository(SQLAlchemyRepository[Endorsement]):
    def __init__(self, session: Session):
        super().__init__(Endorsement, session)

    def list_for_worker(self, worker_id: UUID) -> List[Endorsement]:
        stmt = select(Endorsement).where(Endorsement.worker_id == worker_id)
        return self.session.execute(stmt).scalars().all()

    def list_for_facility(self, facility_id: UUID) -> List[Endorsement]:
        stmt = select(Endorsement).where(Endorsement.facility_id == facility_id)
        return self.session.execute(stmt).scalars().all()

    def get_for_worker(self, endorsement_id: UUID, worker_id: UUID) -> Optional[Endorsement]:
        stmt = select(Endorsement).where(
            Endorsement.id == endorsement_id, Endorsement.worker_id == worker_id
        )
        return self.session.execute(stmt).scalars().first()

    def get_for_facility(self, endorsement_id: UUID, facility_id: UUID) -> Optional[Endorsement]:
        stmt = select(Endorsement).where(
            Endorsement.id == endorsement_id, Endorsement.facility_id == facility_id
        )
        return self.session.execute(stmt).scalars().first()

    def get_for_facility_and_worker(
        self, facility_id: UUID, worker_id: UUID
    ) -> Optional[Endorsement]:
        stmt = select(Endorsement).where(
            Endorsement.facility_id == facility_id, Endorsement.worker_id == worker_id
        )
        return self.session.execute(stmt).scalars().first()

    def add_endorsement(self, payload: dict) -> Endorsement:
        endorsement = Endorsement(**payload)
        self.session.add(endorsement)
        self.session.flush()
        return endorsement
