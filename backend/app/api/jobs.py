#!/usr/bin/env python3
"""Job post and application API connection"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app import crud
from app.schemas.job import JobPost, JobPostCreate, JobPostUpdate, JobApplication, JobApplicationCreate

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", response_model=JobPost)
def create_job(job_in: JobPostCreate, db: Session = Depends(get_db)):
    return crud.job.create_job_post(db, job_in)

@router.get("/", response_model=list[JobPost])
def read_jobs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return crud.job.get_all_job_posts(db, skip, limit)

@router.get("/{job_id}", response_model=JobPost)
def read_job(job_id: UUID, db: Session = Depends(get_db)):
    job = crud.job.get_job_post(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=JobPost)
def update_job(job_id: UUID, job_in: JobPostUpdate, db: Session = Depends(get_db)):
    job = crud.job.update_job_post(db, job_id, job_in)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.delete("/{job_id}")
def delete_job(job_id: UUID, db: Session = Depends(get_db)):
    job = crud.job.delete_job_post(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"detail": "Job deleted"}

@router.post("/apply", response_model=JobApplication)
def apply_for_job(app_in: JobApplicationCreate, db: Session = Depends(get_db)):
    return crud.job.create_job_application(db, app_in)

@router.get("/{job_id}/applications", response_model=list[JobApplication])
def get_job_applications(job_id: UUID, db: Session = Depends(get_db)):
    return crud.job.get_applications_for_job(db, job_id)