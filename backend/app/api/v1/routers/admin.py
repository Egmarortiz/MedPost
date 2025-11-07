"""Admin endpoints for verification management."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from pydantic import BaseModel

from app.api.deps import get_db, require_any_role
from app.models import VerificationStatus, Worker, Facility, UserRole
from sqlalchemy.orm import Session

router = APIRouter(tags=["admin"])


class PendingVerification(BaseModel):
    worker_id: UUID | None = None
    facility_id: UUID | None = None
    full_name: str | None = None
    legal_name: str | None = None
    email: str
    title: str | None = None
    industry: str | None = None
    license_id: str | None = None
    selfie_url: str | None = None
    id_photo_url: str | None = None
    profile_image_url: str | None = None
    resume_url: str | None = None
    verification_submitted_at: datetime | None = None
    verification_status: str
    
    class Config:
        from_attributes = True


class ApproveVerificationRequest(BaseModel):
    worker_id: Optional[str] = None  
    facility_id: Optional[str] = None  
    approved: bool = True 
class ApproveVerificationResponse(BaseModel):
    message: str
    worker_id: Optional[UUID] = None
    facility_id: Optional[UUID] = None
    new_status: str


@router.get("/verifications/pending", response_model=List[PendingVerification])
def list_pending_verifications(
    db: Session = Depends(get_db),
    current_user = Depends(require_any_role(UserRole.WORKER))
) -> List[PendingVerification]:
    result = []
    
    workers = db.query(Worker).filter(
        Worker.verification_status == VerificationStatus.PENDING
    ).all()
    
    for worker in workers:
        result.append(PendingVerification(
            worker_id=worker.id,
            email=worker.user.email if worker.user else "N/A",
            full_name=worker.full_name,
            title=worker.title.value if worker.title else None,
            selfie_url=worker.selfie_url,
            id_photo_url=worker.id_photo_url,
            profile_image_url=worker.profile_image_url,
            resume_url=worker.resume_url,
            verification_submitted_at=worker.verification_submitted_at,
            verification_status=worker.verification_status.value,
        ))
    
    # Get pending facilities
    facilities = db.query(Facility).filter(
        Facility.is_verified == False,
        Facility.id_photo_url != None
    ).all()
    
    print(f"\n=== ADMIN PENDING VERIFICATIONS ===")
    print(f"Workers pending: {len(workers)}")
    print(f"Facilities pending: {len(facilities)}")
    for facility in facilities:
        print(f"  Facility: {facility.legal_name}")
        print(f"    id_photo_url: {facility.id_photo_url}")
        print(f"    license_id: {facility.license_id}")
    print(f"=== END ADMIN ===\n")
    
    for facility in facilities:
        result.append(PendingVerification(
            facility_id=facility.id,
            email=facility.user.email if facility.user else "N/A",
            legal_name=facility.legal_name,
            industry=facility.industry.value,
            license_id=getattr(facility, 'license_id', None),
            id_photo_url=getattr(facility, 'id_photo_url', None),
            profile_image_url=facility.profile_image_url,
            verification_submitted_at=facility.verification_submitted_at,
            verification_status="PENDING",
        ))
    
    return result


@router.post("/verifications/approve")
async def approve_verification(
    request: Request,
    db: Session = Depends(get_db),
    current_user = Depends(require_any_role(UserRole.WORKER))
):
    # Read raw request body to bypass Pydantic validation
    body = await request.json()
    
    print(f"\n=== RAW REQUEST BODY ===")
    print(f"Body: {body}")
    print(f"Body type: {type(body)}")
    print(f"=== END RAW BODY ===\n")
    
    worker_id = body.get("worker_id")
    facility_id = body.get("facility_id")
    approved = body.get("approved", True)
    
    print(f"\n=== APPROVE VERIFICATION DEBUG ===")
    print(f"Worker ID: {worker_id}")
    print(f"Facility ID: {facility_id}")
    print(f"Approved: {approved}")
    print(f"=== END DEBUG ===\n")
    
    # Handle worker verification
    if worker_id:
        try:
            worker_uuid = UUID(str(worker_id)) if isinstance(worker_id, str) else worker_id
            worker = db.query(Worker).filter(Worker.id == worker_uuid).first()
            
            if not worker:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Worker not found"
                )
            
            if approved:
                worker.verification_status = VerificationStatus.COMPLETED
                worker.verification_completed_at = datetime.utcnow()
                message = f"Worker {worker.full_name} has been verified and can now apply to jobs."
            else:
                worker.verification_status = VerificationStatus.NOT_STARTED
                worker.verification_completed_at = None
                message = f"Worker {worker.full_name} verification was rejected. They will need to resubmit."
            
            db.commit()
            db.refresh(worker)
            
            return {
                "message": message,
                "worker_id": str(worker.id),
                "new_status": worker.verification_status.value
            }
        except ValueError as e:
            print(f"ERROR: Could not parse worker_id: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid worker ID format: {worker_id}"
            )
    
    # Handle facility verification
    elif facility_id:
        try:
            facility_uuid = UUID(str(facility_id)) if isinstance(facility_id, str) else facility_id
            facility = db.query(Facility).filter(Facility.id == facility_uuid).first()
            
            if not facility:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Facility not found"
                )
            
            if approved:
                facility.is_verified = True
                message = f"Facility {facility.legal_name} has been verified."
            else:
                facility.is_verified = False
                facility.id_photo_url = None
                facility.license_id = None
                message = f"Facility {facility.legal_name} verification was rejected. They will need to resubmit."
            
            db.commit()
            db.refresh(facility)
            
            print(f"Facility verification updated: {facility.legal_name} - is_verified: {facility.is_verified}")
            
            return {
                "message": message,
                "facility_id": str(facility.id),
                "new_status": "VERIFIED" if facility.is_verified else "PENDING"
            }
        except ValueError as e:
            print(f"ERROR: Could not parse facility_id: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid facility ID format: {facility_id}"
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either worker_id or facility_id must be provided"
        )

