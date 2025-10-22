from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.deps import get_db
from app import models
from app.schemas import (
    WorkerCreate, WorkerOut,
    FacilityCreate, FacilityOut,
    ApplicationCreate, ApplicationOut
)

app = FastAPI(title="MedPost Demo API")

# ---- Workers ----
@app.post("/workers", response_model=WorkerOut, status_code=201)
def create_worker(payload: WorkerCreate, db: Session = Depends(get_db)):
    w = models.Worker(**payload.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

@app.get("/workers/{worker_id}", response_model=WorkerOut)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    w = db.get(models.Worker, worker_id)
    if not w:
        raise HTTPException(404, "Worker not found")
    return w

@app.get("/workers", response_model=list[WorkerOut])
def list_workers(db: Session = Depends(get_db)):
    rows = db.execute(select(models.Worker).order_by(models.Worker.id)).scalars().all()
    return rows

# ---- Facilities ----
@app.post("/facilities", response_model=FacilityOut, status_code=201)
def create_facility(payload: FacilityCreate, db: Session = Depends(get_db)):
    f = models.Facility(**payload.model_dump())
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@app.get("/facilities", response_model=list[FacilityOut])
def list_facilities(db: Session = Depends(get_db)):
    return db.execute(select(models.Facility).order_by(models.Facility.id)).scalars().all()

# ---- Applications ----
@app.post("/applications", response_model=ApplicationOut, status_code=201)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    # (optional) basic FK existence checks
    if not db.get(models.Worker, payload.worker_id):
        raise HTTPException(400, "worker_id does not exist")
    if not db.get(models.Facility, payload.facility_id):
        raise HTTPException(400, "facility_id does not exist")

    a = models.Application(**payload.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@app.get("/applications", response_model=list[ApplicationOut])
def list_applications(db: Session = Depends(get_db)):
    return db.execute(select(models.Application).order_by(models.Application.id)).scalars().all()

