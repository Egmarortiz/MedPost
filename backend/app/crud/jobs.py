#!/usr/bin/env python3
"""Job posts and application CRUD functions"""

from sqlalchemy.orm import Session
from uuid import UUID
from app.models.jobs import JobPost, JobApplication
from app.schemas.job import JobPostCreate, JobPostUpdate, JobApplicationCreate

# Job posts
def create_job_post(db: Session, job_in: JobPostCreate):
    job = JobPost(**job_in.dict())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def get_job_post(db: Session, job_id: UUID):
    return db.query(JobPost).filter(JobPost.id == job_id).first()

def get_all_job_posts(db: Session, skip: int = 0, limit: int = 50):
    return db.query(JobPost).offset(skip).limit(limit).all()

def update_job_post(db: Session, job_id: UUID, job_in: JobPostUpdate):
    job = db.query(JobPost).filter(JobPost.id == job_id).first()
    if not job:
        return None
    for key, value in job_in.dict(exclude_unset=True).items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return job

def delete_job_post(db: Session, job_id: UUID):
    job = db.query(JobPost).filter(JobPost.id == job_id).first()
    if not job:
        return None
    db.delete(job)
    db.commit()
    return job

# Job application
def create_job_application(db: Session, app_in: JobApplicationCreate):
    app = JobApplication(**app_in.dict())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

def get_applications_for_job(db: Session, job_post_id: UUID):
    return db.query(JobApplication).filter(JobApplication.job_post_id == job_post_id).all()
