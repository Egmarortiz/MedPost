#!/bin/bash/env python3
"""Worker CRUD functions"""

from sqlalchemy.orm import Session
from uuid import UUID
from app.models.worker import Worker, Experience, WorkerCredential
from ..schemas.worker import (
    WorkerCreate, WorkerUpdate, ExperienceCreate, ExperienceUpdate, WorkerCredentialCreate
)

def create_worker(db: Session, worker_in: WorkerCreate) -> Worker:
    db_worker = Worker(**worker_in.dict())
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker

def get_worker(db: Session, worker_id: UUID) -> Worker | None:
    return db.query(Worker).filter(Worker.id == worker_id).first()

def update_worker(db: Session, worker_id: UUID, worker_in: WorkerUpdate) -> Worker | None:
    db_worker = get_worker(db, worker_id)
    if not db_worker:
        return None
    for field, value in worker_in.dict(exclude_unset=True).items():
        setattr(db_worker, field, value)
    db.commit()
    db.refresh(db_worker)
    return db_worker

def delete_worker(db: Session, worker_id: UUID) -> bool:
    db_worker = get_worker(db, worker_id)
    if not db_worker:
        return False
    db.delete(db_worker)
    db.commit()
    return True

# Worker experience CRUD functions
def create_experience(db: Session, worker_id: UUID, payload: ExperienceCreate) -> Experience:
    obj = Experience(worker_id=worker_id, **payload.dict(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def list_experiences(db: Session, worker_id: UUID) -> List[Experience]:
    stmt = select(Experience).where(Experience.worker_id == worker_id)
    return db.execute(stmt).scalars().all()

def get_experience(db: Session, exp_id: UUID, payload: ExperienceUpdate) -> Optional[Experience]:
    return db.get(Experience, exp_id)

def update_experience(db: Session, exp_id: UUID, payload: ExperienceUpdate) -> Optional[Experience]:
    obj = get_experience(db, exp_id)
    if not obj:
        return None
    for k, v in payload.dict(exclude_unset=True),items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_experience(db: Session, exp_id: UUID) -> bool:
    obj = get_experience(db, exp_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True

# Worker credentials CRUD functions
def add_credential(db: Session, worker_id: UUID, payload: WorkerCredentialCreate) -> WorkerCredential:
    obj = WorkerCredential(worker_id=worker_id, **payload.dict(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def list_credential(db: Session, worker_id: UUID) -> List[WorkerCredential]:
    stmt = select(WorkerCredential).where(WorkerCredential.worker_id == worker_id)
    return db.execute(stmt).scalars().all()

def get_credential(db: Session, cred_id: UUID) -> Optional[WorkerCredential]:
    return db.get(WorkerCredential, cred_id)
