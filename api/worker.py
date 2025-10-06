#!/bin/bash/env python3
"""API connection for worker CRUD functions"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from db import get_db
from app import crud
from models.worker import Worker
from schemas.worker import (
    WorkerCreate, WorkerRead, ExperienceCreate, ExperienceUpdate, ExperienceRead, WorkerCredentialCreate, WorkerCredentialRead, 
)

router = APIRouter(prefix="/workers", tags=["workers-experience-credentials"])


@router.post("/", response_model=WorkerRead,status_code=status.HTTP_201_CREATED)
def create_worker(worker: WorkerCreate, db: Session = Depends(get_db)):
    db_worker = Worker(**worker.dict())
    db.add(db_worker)
    db.commit()
    db.refresh(db_worker)
    return db_worker

@route.get("/{worker_id}", response_model=WorkerRead)
def get_worker(worker_id: UUID, db: Session = Depends(get_db)):
    db_worker = crud_worker(db, worker_id)
    if not db_worker:
        raise HTTPException(status_code=404, detail="This user is not found")
    return db_worker

@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(worker_id: UUID, db: Session = Depends(get_db)):
    success = crud.worker.delete_worker(db, worker_id)
    if not success:
        raise HTTPException(status_code=404, detail="Worker not found")
    return None

# Worker experience routes
@route.post("/{worker_id}/experiences", response_model=ExperienceRead, status_code=status.HTTP_201_CREATED)
def create_experience(worker_id: UUID, payload: ExperienceCreate, db: Session = Depends(get_db)):
    return crud.worker.add_experience(db, worker_id, payload)

@router.get("/{worker_id}/experiences}", response_model=List[ExperienceRead])
def list_experiences(worker_id: UUID, db: Session = Depends(get_db)):
    return crud.worker.list_experiences(db, worker_id)

@route.put("/experiences/{exp_id}", response_model=ExperienceRead)
def update_experience(exp_id: UUID, payload: ExperienceUpdate, db: Session = Depends(get_db)):
    obj = crud.worker.update_experience(db, exp_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Experience not found")
    return obj

@route.delete("/experiences/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(exp_id: UUID, db: Session = Depends(get_db)):
    ok = crud.worker.delete_experience(db, exp_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Experience not found")
    return None

# Worker credentials API route
@router.post("/{worker_id}/credentials", response_model=WorkerCredentialRead, status_code=status.HTTP_201_CREATED)
def create_credential(worker_id: UUID, payload: WorkerCredentialCreate, db: Session = Depends(get_db)):
    return crud.worker.add_credential(db, worker_id, payload)

@router.get("/{worker_id}/credentials", response_model=List[WorkerCredentialRead])
def list_credentials(worker_id: UUID, db: Session = Depends(get_db)):
    return crud.worker.list_credentials(db, worker_id)