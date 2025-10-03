#!/bin/bash/env python3
"""Worker CRUD functions"""

from sqlalchemy.orm import Session
from uuid import UUID
from ..models.worker import Worker
from ..schemas.worker import WorkerCreate, WorkerUpdate

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
