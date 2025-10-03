#!/bin/bash/env python3
"""API connection for worker CRUD functions"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from db import get_db
from models.worker import Worker
from schemas.worker import WorkerCreate, WorkerRead


router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("/", response_model=WorkerRead,status.HTTP_201_CREATED)
def create_worker(worker: WorkerCreate, db: Session = Depends(get_db)):
    return crud_worker.create_worker(db, worker)

@route.get("/{worker_id}", response_model=WorkerRead)
def get_worker(worker_id: UUID, db: Session = Depends(get_db)):
    db_worker = crud_worker(db, worker_id)
    if not db_worker:
        raise HTTPException(status_code=404, detail="This user is not found")
    return db_worker

@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(worker_id: UUID, db: Session = Depends(get_db)):
    success = crud_worker.delete_worker(db, worker_id)
    if not success:
        raise HTTPException(status_code=404, detail="Worker not found")
    return None
