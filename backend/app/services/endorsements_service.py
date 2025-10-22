"""Business logic for endorsements."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Endorsement
from app.repositories import (
    EndorsementRepository,
    FacilityRepository,
    WorkerRepository,
)
from app.schemas import EndorsementCreate, EndorsementUpdate


class EndorsementAlreadyExistsError(Exception):
    """Raised when attempting to create a duplicate endorsement."""


class EndorsementsService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = EndorsementRepository(session)
        self.facilities = FacilityRepository(session)
        self.workers = WorkerRepository(session)

    def list_for_worker(self, worker_id: UUID) -> Optional[List[Endorsement]]:
        if not self.workers.get_worker(worker_id):
            return None
        return self.repo.list_for_worker(worker_id)

    def list_for_facility(self, facility_id: UUID) -> Optional[List[Endorsement]]:
        if not self.facilities.get_facility(facility_id):
            return None
        return self.repo.list_for_facility(facility_id)

    def create_endorsement(
        self, facility_id: UUID, payload: EndorsementCreate
    ) -> Optional[Endorsement]:
        worker = self.workers.get_worker(payload.worker_id)
        if not worker:
            return None

        if self.repo.get_for_facility_and_worker(facility_id, payload.worker_id):
            raise EndorsementAlreadyExistsError

        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        data["facility_id"] = facility_id
        endorsement = self.repo.add_endorsement(data)
        self.session.commit()
        self.session.refresh(endorsement)
        return endorsement

    def update_endorsement(
        self,
        endorsement_id: UUID,
        facility_id: UUID,
        payload: EndorsementUpdate,
    ) -> Optional[Endorsement]:
        endorsement = self.repo.get_for_facility(endorsement_id, facility_id)
        if not endorsement:
            return None

        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        for key, value in data.items():
            setattr(endorsement, key, value)
        self.session.commit()
        self.session.refresh(endorsement)
        return endorsement

    def delete_as_facility(self, endorsement_id: UUID, facility_id: UUID) -> bool:
        endorsement = self.repo.get_for_facility(endorsement_id, facility_id)
        if not endorsement:
            return False
        self.repo.delete(endorsement)
        self.session.commit()
        return True

    def delete_as_worker(self, endorsement_id: UUID, worker_id: UUID) -> bool:
        endorsement = self.repo.get_for_worker(endorsement_id, worker_id)
        if not endorsement:
            return False
        self.repo.delete(endorsement)
        self.session.commit()
        return True

    def get_facility_for_user(self, user_id: UUID):
        return self.facilities.get_by_user_id(user_id)

    def get_worker_for_user(self, user_id: UUID):
        return self.workers.get_by_user_id(user_id)
