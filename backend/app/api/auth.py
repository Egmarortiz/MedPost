#!/usr/bin/env python3
"""Login session authentication"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi_jwt_auth import AuthJWT
from passlib.context import CryptContext
from datetime import timedelta
from jose import JWTError, jwt
from app.schemas.worker import WorkerCreate, WorkerLogin, WorkerOut
from app.schemas.facility import FacilityCreate, FacilityLogin, FacilityOut
from app.crud import worker, facility
from app.databases import get_db

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

# Password verification and tokenization
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(identity: str, Authorize: AuthJWT):
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return Authorize.create_access_token(subject=identity, expires_time=expires)

# Worker login routes
@router.post("/worker/register", response_model=WorkerOut)
def register_worker(worker_data: WorkerCreate, db: Session = Depends(get_db)):
    existing = worker.get_worker_by_email(db, worker_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Worker already registered")
    
    hashed_pw = get_password_hash(worker_data.password)
    worker_data.password = hashed_pw
    new_worker = worker.create_worker(db, worker_data)
    return new_worker

@router.post("/worker/login")
def login_worker(login_data: WorkerLogin, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    worker = worker.get_worker_by_email(db, login_data.email)
    if not worker or not verify_password(login_data.password, worker.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(identity=str(worker.id), Authorize=Authorize)
    return {"access_token": access_token, "token_type": "bearer"}

# Facility login routes
@router.post("/facility/register", response_model=FacilityOut)
def register_facility(facility_data: FacilityCreate, db: Session = Depends(get_db)):
    existing = facility.get_facility_by_email(db, facility_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Facility already registered")
    
    hashed_pw = get_password_hash(facility_data.password)
    facility_data.password = hashed_pw
    new_facility = facility.create_facility(db, facility_data)
    return new_facility

@router.post("/facility/login")
def login_facility(login_data: FacilityLogin, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    facility = facility.get_facility_by_email(db, login_data.email)
    if not facility or not verify_password(login_data.password, facility.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(identity=str(facility.id), Authorize=Authorize)
    return {"access_token": access_token, "token_type": "bearer"}

# Logout route
@router.post("/logout")
def logout_user(Authorize: AuthJWT = Depends()):
    Authorize.unset_jwt_cookies()
    return {"msg": "Successfully logged out"}
