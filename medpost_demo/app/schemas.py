from pydantic import BaseModel
from typing import Optional

# ---- Workers ----
class WorkerCreate(BaseModel):
    full_name: str
    role: str
    license_number: Optional[str] = None

class WorkerOut(BaseModel):
    id: int
    full_name: str
    role: str
    license_number: Optional[str] = None
    class Config:
        from_attributes = True  # pydantic v2: ORM mode

# ---- Facilities ----
class FacilityCreate(BaseModel):
    legal_name: str
    industry: str

class FacilityOut(BaseModel):
    id: int
    legal_name: str
    industry: str
    class Config:
        from_attributes = True

# ---- Applications ----
class ApplicationCreate(BaseModel):
    worker_id: int
    facility_id: int
    status: str = "submitted"

class ApplicationOut(BaseModel):
    id: int
    worker_id: int
    facility_id: int
    status: str
    class Config:
        from_attributes = True

