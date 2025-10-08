from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Worker
from app.repositories import WorkerRepository
from app.schemas import (
    ExperienceCreate,
    ExperienceRead,
    WorkerCreate,
    WorkerCredentialCreate,
    WorkerCredentialRead,
    WorkerFilter,
    WorkerUpdate,
    PaginationParams,
)


class WorkersService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = WorkerRepository(session)

    def list_workers(self, filters: WorkerFilter, pagination: PaginationParams) -> List[Worker]:
        return self.repo.list_filtered(filters, pagination)

    def get_worker(self, worker_id: UUID) -> Worker | None:
        return self.repo.get_worker(worker_id)

    def create_worker(self, payload: WorkerCreate) -> Worker:
        worker = Worker(**payload.dict(exclude_unset=True))
        self.repo.add(worker)
        self.session.commit()
        self.session.refresh(worker)
        return worker

    def update_worker(self, worker_id: UUID, payload: WorkerUpdate) -> Worker | None:
        worker = self.repo.get_worker(worker_id)
        if not worker:
            return None
        for key, value in payload.dict(exclude_unset=True).items():
            setattr(worker, key, value)
        self.session.commit()
        self.session.refresh(worker)
        return worker

    def add_experience(self, worker_id: UUID, payload: ExperienceCreate) -> ExperienceRead:
        experience = self.repo.add_experience(worker_id, payload.dict(exclude_unset=True))
        self.session.commit()
        self.session.refresh(experience)
        return ExperienceRead.from_orm(experience)

    def list_experiences(self, worker_id: UUID) -> List[ExperienceRead]:
        experiences = self.repo.list_experiences(worker_id)
        return [ExperienceRead.from_orm(exp) for exp in experiences]

    def add_credential(self, worker_id: UUID, payload: WorkerCredentialCreate) -> WorkerCredentialRead:
        credential = self.repo.add_credential(worker_id, payload.dict(exclude_unset=True))
        self.session.commit()
        self.session.refresh(credential)
        return WorkerCredentialRead.from_orm(credential)

    def list_credentials(self, worker_id: UUID) -> List[WorkerCredentialRead]:
        credentials = self.repo.list_credentials(worker_id)
        return [WorkerCredentialRead.from_orm(cred) for cred in credentials]
