from __future__ import annotations

from typing import List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from ..models import Worker, VerificationStatus
from app.repositories import WorkerRepository
from app.schemas import (
    ExperienceCreate,
    ExperienceRead,
    ExperienceUpdate,
    WorkerCreate,
    WorkerCredentialCreate,
    WorkerCredentialRead,
    SafetyCheckCreate,
    SafetyCheckRead,
    SafetyCheckSummary,
    WorkerFilter,
    WorkerUpdate,
    PaginationParams,
)


class WorkersService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = WorkerRepository(session)

    def list_workers(
        self, filters: WorkerFilter, pagination: PaginationParams
    ) -> Tuple[List[Worker], int]:
        return self.repo.list_filtered(filters, pagination)

    def get_worker(self, worker_id: UUID) -> Worker | None:
        return self.repo.get_worker(worker_id)

    def create_worker(self, payload: WorkerCreate) -> Worker:
        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        worker = Worker(**data)
        self.repo.add(worker)
        self.session.commit()
        self.session.refresh(worker)
        return worker

    def update_worker(self, worker_id: UUID, payload: WorkerUpdate) -> Worker | None:
        worker = self.repo.get_worker(worker_id)
        if not worker:
            return None
        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        for key, value in data.items():
            setattr(worker, key, value)
        self.session.commit()
        self.session.refresh(worker)
        return worker

    def delete_worker(self, worker_id: UUID) -> bool:
        worker = self.repo.get_worker(worker_id)
        if not worker:
            return False
        
        user = worker.user
        if user:
            self.session.delete(user)
        else:
            # If no user, delete the worker directly
            self.repo.delete(worker)
        
        self.session.commit()
        return True

    def add_experience(self, worker_id: UUID, payload: ExperienceCreate) -> ExperienceRead:
        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        experience = self.repo.add_experience(worker_id, data)
        self.session.commit()
        self.session.refresh(experience)
        return ExperienceRead.from_orm(experience)

    def list_experiences(self, worker_id: UUID) -> List[ExperienceRead]:
        experiences = self.repo.list_experiences(worker_id)
        return [
            ExperienceRead(
                id=exp.id,
                worker_id=exp.worker_id,
                company_name=exp.company_name,
                position_title=exp.position_title,
                start_date=exp.start_date,
                end_date=exp.end_date,
                description=exp.description,
            )
            for exp in experiences
        ]

    def get_experience(self, worker_id: UUID, experience_id: UUID) -> ExperienceRead | None:
        experience = self.repo.get_experience(worker_id, experience_id)
        if not experience:
            return None
        return ExperienceRead.from_orm(experience)

    def update_experience(
        self, worker_id: UUID, experience_id: UUID, payload: ExperienceUpdate
    ) -> ExperienceRead | None:
        experience = self.repo.get_experience(worker_id, experience_id)
        if not experience:
            return None

        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        for key, value in data.items():
            setattr(experience, key, value)
        self.session.commit()
        self.session.refresh(experience)
        return ExperienceRead.from_orm(experience)

    def delete_experience(self, worker_id: UUID, experience_id: UUID) -> bool:
        experience = self.repo.get_experience(worker_id, experience_id)
        if not experience:
            return False
        self.repo.delete_experience(experience)
        self.session.commit()
        return True

    def add_credential(self, worker_id: UUID, payload: WorkerCredentialCreate) -> WorkerCredentialRead:
        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        credential = self.repo.add_credential(worker_id, data)
        self.session.commit()
        self.session.refresh(credential)
        return WorkerCredentialRead.from_orm(credential)

    def list_credentials(self, worker_id: UUID) -> List[WorkerCredentialRead]:
        credentials = self.repo.list_credentials(worker_id)
        return [WorkerCredentialRead.from_orm(cred) for cred in credentials]

    def delete_credential(self, worker_id: UUID, credential_id: UUID) -> bool:
        credential = self.repo.get_credential(worker_id, credential_id)
        if not credential:
            return False
        self.repo.delete(credential)
        self.session.commit()
        return True

    def submit_safety_check(
        self, worker_id: UUID, payload: SafetyCheckCreate
    ) -> SafetyCheckRead:
        data = (
            payload.model_dump(exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        if "evidence_url" in data and data["evidence_url"] is not None:
            data["evidence_url"] = str(data["evidence_url"])
        data["status"] = VerificationStatus.PENDING
        existing = self.repo.get_safety_check_by_tier(worker_id, data["tier"])
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            self.session.commit()
            self.session.refresh(existing)
            return SafetyCheckRead.from_orm(existing)

        safety_check = self.repo.add_safety_check(worker_id, data)
        self.session.commit()
        self.session.refresh(safety_check)
        return SafetyCheckRead.from_orm(safety_check)

    def list_safety_checks(self, worker_id: UUID) -> List[SafetyCheckRead]:
        checks = self.repo.list_safety_checks(worker_id)
        return [SafetyCheckRead.from_orm(check) for check in checks]

    def list_safety_check_summaries(self, worker_id: UUID) -> List[SafetyCheckSummary]:
        checks = self.repo.list_safety_checks(worker_id)
        return [
            SafetyCheckSummary(tier=check.tier, status=check.status)
            for check in checks
        ]

    def get_worker_for_user(self, user_id: UUID) -> Worker | None:
        return self.repo.get_by_user_id(user_id)
