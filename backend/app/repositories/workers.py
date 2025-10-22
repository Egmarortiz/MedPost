"""Worker repository."""

from __future__ import annotations

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Endorsement,
    Experience,
    SafetyCheck,
    SafetyTier,
    Worker,
    WorkerCredential,
)
from app.schemas import PaginationParams, WorkerFilter
from .base import SQLAlchemyRepository


class WorkerRepository(SQLAlchemyRepository[Worker]):
    def __init__(self, session: Session):
        super().__init__(Worker, session)

    def list_filtered(
        self, filters: WorkerFilter, params: Optional[PaginationParams] = None
    ) -> Tuple[List[Worker], int]:
        stmt = select(Worker)
        if filters.title:
            stmt = stmt.where(Worker.title == filters.title)
        if filters.city:
            stmt = stmt.where(Worker.city == filters.city)
        if filters.education_level:
            stmt = stmt.where(Worker.education_level == filters.education_level)
        if filters.has_endorsements is not None:
            endorsement_exists = (
                select(Endorsement.id)
                .where(Endorsement.worker_id == Worker.id)
                .exists()
            )
            if filters.has_endorsements:
                stmt = stmt.where(endorsement_exists)
            else:
                stmt = stmt.where(~endorsement_exists)
        total_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.session.execute(total_stmt).scalar_one()
        query = stmt
        if params:
            query = query.offset(params.offset).limit(params.limit)
        workers = self.session.execute(query).scalars().all()
        return workers, total

    def get_worker(self, worker_id: UUID) -> Optional[Worker]:
        return self.session.get(Worker, worker_id)

    def get_by_user_id(self, user_id: UUID) -> Optional[Worker]:
        stmt = select(Worker).where(Worker.user_id == user_id)
        return self.session.execute(stmt).scalars().first()

    def add_experience(self, worker_id: UUID, payload: dict) -> Experience:
        obj = Experience(worker_id=worker_id, **payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_experiences(self, worker_id: UUID) -> List[Experience]:
        stmt = select(Experience).where(Experience.worker_id == worker_id)
        return self.session.execute(stmt).scalars().all()

    def get_experience(self, worker_id: UUID, experience_id: UUID) -> Optional[Experience]:
        stmt = select(Experience).where(
            Experience.worker_id == worker_id,
            Experience.id == experience_id,
        )
        return self.session.execute(stmt).scalars().first()

    def delete_experience(self, experience: Experience) -> None:
        self.session.delete(experience)

    def add_credential(self, worker_id: UUID, payload: dict) -> WorkerCredential:
        obj = WorkerCredential(worker_id=worker_id, **payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_credentials(self, worker_id: UUID) -> List[WorkerCredential]:
        stmt = select(WorkerCredential).where(WorkerCredential.worker_id == worker_id)
        return self.session.execute(stmt).scalars().all()

    def get_credential(self, worker_id: UUID, credential_id: UUID) -> Optional[WorkerCredential]:
        stmt = select(WorkerCredential).where(
            WorkerCredential.worker_id == worker_id,
            WorkerCredential.id == credential_id,
        )
        return self.session.execute(stmt).scalars().first()

    def add_safety_check(self, worker_id: UUID, payload: dict) -> SafetyCheck:
        obj = SafetyCheck(worker_id=worker_id, **payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_safety_checks(self, worker_id: UUID) -> List[SafetyCheck]:
        stmt = select(SafetyCheck).where(SafetyCheck.worker_id == worker_id)
        return self.session.execute(stmt).scalars().all()

    def get_safety_check_by_tier(
        self, worker_id: UUID, tier: SafetyTier
    ) -> Optional[SafetyCheck]:
        stmt = select(SafetyCheck).where(
            SafetyCheck.worker_id == worker_id,
            SafetyCheck.tier == tier,
        )
        return self.session.execute(stmt).scalars().first()
