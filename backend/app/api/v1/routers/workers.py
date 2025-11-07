"""Worker REST endpoints."""

from __future__ import annotations

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from sqlalchemy import or_, func, cast, String
from sqlalchemy.orm import Session

from app.core import PuertoRicoMunicipality
from app.core.security import TokenPayload, decode_jwt
from app.models import EducationLevel, UserRole, Worker, WorkerTitle
from app.schemas import (
    ExperienceCreate,
    ExperienceRead,
    ExperienceUpdate,
    PaginatedResponse,
    SafetyCheckCreate,
    SafetyCheckRead,
    SafetyCheckSummary,
    WorkerCreate,
    WorkerCredentialCreate,
    WorkerCredentialRead,
    WorkerFilter,
    WorkerRead,
    WorkerUpdate,
)
from app.api.deps import (
    get_pagination_params,
    get_workers_service,
    require_role,
    get_db,
    get_current_user,
)
from app.schemas.pagination import PaginationParams
from app.services.workers_service import WorkersService

router = APIRouter()


WorkerUser = Annotated[TokenPayload, Depends(require_role(UserRole.WORKER.value))]
FacilityUser = Annotated[TokenPayload, Depends(require_role(UserRole.FACILITY.value))]


def _get_user_id(payload: TokenPayload) -> UUID:
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    try:
        return UUID(str(sub))
    except ValueError as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid authentication token",
        ) from exc


def _get_worker(service: WorkersService, payload: TokenPayload) -> Worker:
    user_id = _get_user_id(payload)
    worker = service.get_worker_for_user(user_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker profile not found",
        )
    return worker


@router.get("/", response_model=PaginatedResponse[WorkerRead])
def list_workers(
    title: Optional[WorkerTitle] = None,
    city: Optional[PuertoRicoMunicipality] = None,
    education_level: Optional[EducationLevel] = None,
    has_endorsements: Optional[bool] = None,
    pagination: PaginationParams = Depends(get_pagination_params),
    service: WorkersService = Depends(get_workers_service),
) -> PaginatedResponse[WorkerRead]:
    try:
        filters = WorkerFilter(
            title=title,
            city=city,
            education_level=education_level,
            has_endorsements=has_endorsements,
        )
        workers, total = service.list_workers(filters, pagination)
        items = []
        for worker in workers:
            try:
                # Get email from related user object
                email = worker.user.email if worker.user else None
                # Create a dict with all worker fields plus email
                data = {
                    'id': worker.id,
                    'full_name': worker.full_name,
                    'email': email,
                    'title': worker.title,
                    'bio': worker.bio,
                    'profile_image_url': worker.profile_image_url,
                    'resume_url': worker.resume_url,
                    'city': worker.city,
                    'state_province': worker.state_province,
                    'postal_code': worker.postal_code,
                    'phone': worker.phone,
                    'education_level': worker.education_level,
                    'verification_status': worker.verification_status,
                    'selfie_url': worker.selfie_url,
                    'id_photo_url': worker.id_photo_url,
                    'verification_submitted_at': worker.verification_submitted_at,
                    'created_at': worker.created_at,
                    'updated_at': worker.updated_at,
                }
                items.append(WorkerRead(**data))
            except Exception as e:
                print(f"Error validating worker {worker.id}: {e}")
                import traceback
                traceback.print_exc()
        return PaginatedResponse[WorkerRead](
            items=items,
            total=total,
            limit=pagination.limit,
            offset=pagination.offset,
        )
    except Exception as e:
        print(f"Error in list_workers: {e}")
        import traceback
        traceback.print_exc()
        # Return empty response
        return PaginatedResponse[WorkerRead](
            items=[],
            total=0,
            limit=pagination.limit,
            offset=pagination.offset,
        )

@router.get("/search")
def search_workers(
    q: str = "",
    endorsed_only: str = "false",
) -> List[dict]:
    """Search workers by name, title, city, or state.
    Endorsed workers appear first
    """
    try:
        from app.db import get_session_factory
        from app.models.base_model import Endorsement, WorkerTitle
        SessionLocal = get_session_factory()
        db = SessionLocal()
        
        is_endorsed_only = endorsed_only.lower() == "true"
        print(f"endorsed_only parameter received: {endorsed_only}, parsed as: {is_endorsed_only}")
        
        if is_endorsed_only and (not q or not q.strip()):
            print("Fetching all endorsed workers (no query filter)")
            # Get all workers that have endorsements
            workers = db.query(Worker).filter(
                Worker.endorsements.any()
            ).limit(50).all()
        elif not q or not q.strip():
            return []
        else:
            search_term = f"%{q.strip()}%"
            search_term_lower = q.strip().lower()
            
            # Build a list of matching title enums for semantic matching
            matching_titles = []
            for title_enum in WorkerTitle:
                # Match on both enum name (e.g., "RN") and full value (e.g., "REGISTERED NURSE")
                if (title_enum.name.lower() in search_term_lower or 
                    search_term_lower in title_enum.name.lower() or
                    title_enum.value.lower().startswith(search_term_lower)):
                    matching_titles.append(title_enum)
            
            # Build the query with title matching
            title_conditions = [
                func.lower(cast(Worker.title, String)).ilike(search_term)
            ]
            if matching_titles:
                title_conditions.append(Worker.title.in_(matching_titles))
            
            query = db.query(Worker).filter(
                or_(
                    func.lower(cast(Worker.full_name, String)).ilike(search_term),
                    or_(*title_conditions) if title_conditions else False,
                    func.lower(cast(Worker.city, String)).ilike(search_term),
                    func.lower(cast(Worker.state_province, String)).ilike(search_term),
                    func.lower(cast(Worker.bio, String)).ilike(search_term),
                )
            ).limit(50)
            
            workers = query.all()
        items = []
        for worker in workers:
            try:
                email = worker.user.email if worker.user else None
                # Count endorsements for this worker
                endorsement_count = db.query(Endorsement).filter(
                    Endorsement.worker_id == worker.id
                ).count()
                
                # Get the enum object to access name and value
                title_enum = worker.title if isinstance(worker.title, WorkerTitle) else WorkerTitle[worker.title]
                
                data = {
                    'id': str(worker.id),
                    'full_name': worker.full_name,
                    'email': email,
                    'title': title_enum.value,  # Use full value like "REGISTERED NURSE"
                    'title_enum': title_enum.name,  # Also include enum name like "RN"
                    'bio': worker.bio,
                    'profile_image_url': worker.profile_image_url,
                    'resume_url': worker.resume_url,
                    'city': worker.city,
                    'state_province': worker.state_province,
                    'postal_code': worker.postal_code,
                    'phone': worker.phone,
                    'education_level': worker.education_level.value if worker.education_level else None,
                    'verification_status': worker.verification_status,
                    'selfie_url': worker.selfie_url,
                    'id_photo_url': worker.id_photo_url,
                    'verification_submitted_at': str(worker.verification_submitted_at) if worker.verification_submitted_at else None,
                    'created_at': str(worker.created_at) if worker.created_at else None,
                    'updated_at': str(worker.updated_at) if worker.updated_at else None,
                    'endorsement_count': endorsement_count,
                }
                items.append(data)
            except Exception as e:
                print(f"Error processing worker {worker.id}: {e}")
                import traceback
                traceback.print_exc()
        
        # Filter by endorsement per request
        if is_endorsed_only:
            print(f"Filtering for endorsed only. Total items before filter: {len(items)}")
            items = [item for item in items if item['endorsement_count'] > 0]
            print(f"Total items after endorsement filter: {len(items)}")
        
        # Sort by endorsement count, then by name
        items.sort(key=lambda x: (-x['endorsement_count'], x['full_name']))
        
        db.close()
        return items
    except Exception as e:
        print(f"Search workers error: {e}")
        import traceback
        traceback.print_exc()
        return []

@router.post("/", response_model=WorkerRead, status_code=status.HTTP_201_CREATED)
def create_worker(
    payload: WorkerCreate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.create_worker(payload)
    try:
        email = worker.user.email if worker.user else None
        data = {
            'id': worker.id,
            'full_name': worker.full_name,
            'email': email,
            'title': worker.title,
            'bio': worker.bio,
            'profile_image_url': worker.profile_image_url,
            'resume_url': worker.resume_url,
            'city': worker.city,
            'state_province': worker.state_province,
            'postal_code': worker.postal_code,
            'phone': worker.phone,
            'education_level': worker.education_level,
            'verification_status': worker.verification_status,
            'selfie_url': worker.selfie_url,
            'id_photo_url': worker.id_photo_url,
            'verification_submitted_at': worker.verification_submitted_at,
            'created_at': worker.created_at,
            'updated_at': worker.updated_at,
        }
        return WorkerRead(**data)
    except Exception as e:
        print(f"Error creating worker response: {e}")
        import traceback
        traceback.print_exc()
        raise


@router.get("/me", response_model=WorkerRead)
def get_current_worker(
    payload: WorkerUser,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    """Get current authenticated worker's profile."""
    worker = _get_worker(service, payload)
    
    experiences_list = []
    if hasattr(worker, 'experiences') and worker.experiences:
        for exp in worker.experiences:
            experiences_list.append({
                'id': exp.id,
                'worker_id': exp.worker_id,
                'company_name': exp.company_name,
                'position_title': exp.position_title,
                'start_date': exp.start_date.isoformat() if exp.start_date else None,
                'end_date': exp.end_date.isoformat() if exp.end_date else None,
                'description': exp.description,
            })
    
    print(f"DEBUG: Experiences count: {len(experiences_list)}")
    print(f"DEBUG: Experiences data: {experiences_list}")
    
    response = WorkerRead(
        id=worker.id,
        full_name=worker.full_name,
        email=worker.user.email if worker.user else None,
        title=worker.title,
        bio=worker.bio,
        profile_image_url=worker.profile_image_url,
        resume_url=worker.resume_url,
        city=worker.city,
        state_province=worker.state_province,
        postal_code=worker.postal_code,
        phone=worker.phone,
        education_level=worker.education_level,
        verification_status=worker.verification_status,
        experiences=experiences_list,
        created_at=worker.created_at,
        updated_at=worker.updated_at,
        selfie_url=worker.selfie_url,
        id_photo_url=worker.id_photo_url,
        verification_submitted_at=worker.verification_submitted_at,
    )
    print(f"DEBUG: Response object experiences: {response.experiences}")
    return response


@router.patch("/me", response_model=WorkerRead)
def update_current_worker(
    payload: WorkerUpdate,
    token_payload: WorkerUser,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    """Update current authenticated worker's profile."""
    worker = _get_worker(service, token_payload)
    updated_worker = service.update_worker(worker.id, payload)
    if not updated_worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found",
        )
    experiences_list = []
    if hasattr(updated_worker, 'experiences') and updated_worker.experiences:
        for exp in updated_worker.experiences:
            experiences_list.append({
                'id': str(exp.id),
                'worker_id': str(exp.worker_id),
                'company_name': exp.company_name,
                'position_title': exp.position_title,
                'start_date': exp.start_date.isoformat() if exp.start_date else None,
                'end_date': exp.end_date.isoformat() if exp.end_date else None,
                'description': exp.description,
            })
    response = WorkerRead(
        id=updated_worker.id,
        full_name=updated_worker.full_name,
        email=updated_worker.user.email if updated_worker.user else None,
        title=updated_worker.title,
        bio=updated_worker.bio,
        profile_image_url=updated_worker.profile_image_url,
        resume_url=updated_worker.resume_url,
        city=updated_worker.city,
        state_province=updated_worker.state_province,
        postal_code=updated_worker.postal_code,
        phone=updated_worker.phone,
        education_level=updated_worker.education_level,
        verification_status=updated_worker.verification_status,
        experiences=experiences_list,
        created_at=updated_worker.created_at,
        updated_at=updated_worker.updated_at,
        selfie_url=updated_worker.selfie_url,
        id_photo_url=updated_worker.id_photo_url,
        verification_submitted_at=updated_worker.verification_submitted_at,
    )
    return response


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_worker(
    token_payload: WorkerUser,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    """Delete current authenticated worker's profile."""
    worker = _get_worker(service, token_payload)
    deleted = service.delete_worker(worker.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{worker_id}", response_model=WorkerRead)
def get_worker(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.get_worker(worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    
    # Build experiences list from worker model
    experiences_list = []
    if hasattr(worker, 'experiences') and worker.experiences:
        for exp in worker.experiences:
            experiences_list.append({
                'id': str(exp.id),
                'worker_id': str(exp.worker_id),
                'company_name': exp.company_name,
                'position_title': exp.position_title,
                'start_date': exp.start_date.isoformat() if exp.start_date else None,
                'end_date': exp.end_date.isoformat() if exp.end_date else None,
                'description': exp.description,
            })
    
    # Manually construct response with email from user relationship
    response = WorkerRead(
        id=worker.id,
        full_name=worker.full_name,
        email=worker.user.email if worker.user else None,
        title=worker.title,
        bio=worker.bio,
        profile_image_url=worker.profile_image_url,
        resume_url=worker.resume_url,
        city=worker.city,
        state_province=worker.state_province,
        postal_code=worker.postal_code,
        phone=worker.phone,
        education_level=worker.education_level,
        verification_status=worker.verification_status,
        experiences=experiences_list,
        created_at=worker.created_at,
        updated_at=worker.updated_at,
        selfie_url=worker.selfie_url,
        id_photo_url=worker.id_photo_url,
        verification_submitted_at=worker.verification_submitted_at,
    )
    return response


@router.patch("/{worker_id}", response_model=WorkerRead)
def update_worker(
    worker_id: UUID,
    payload: WorkerUpdate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.update_worker(worker_id, payload)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return WorkerRead.from_orm(worker)


@router.get("/{worker_id}", response_model=WorkerRead)
def get_worker_by_id(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    """Get a worker profile by ID, including experiences."""
    worker = service.get_worker(worker_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker not found",
        )

    # Build experiences
    experiences_list: list[dict] = []
    if hasattr(worker, "experiences") and worker.experiences:
        for exp in worker.experiences:
            experiences_list.append(
                {
                    "id": exp.id,
                    "worker_id": exp.worker_id,
                    "company_name": exp.company_name,
                    "position_title": exp.position_title,
                    "start_date": exp.start_date.isoformat() if getattr(exp, "start_date", None) else None,
                    "end_date": exp.end_date.isoformat() if getattr(exp, "end_date", None) else None,
                    "description": exp.description,
                }
            )

    return WorkerRead(
        id=worker.id,
        full_name=worker.full_name,
        email=worker.user.email if worker.user else None,
        title=worker.title,
        bio=worker.bio,
        profile_image_url=worker.profile_image_url,
        resume_url=worker.resume_url,
        city=worker.city,
        state_province=worker.state_province,
        postal_code=worker.postal_code,
        phone=worker.phone,
        education_level=worker.education_level,
        verification_status=worker.verification_status,
        experiences=experiences_list,
        created_at=worker.created_at,
        updated_at=worker.updated_at,
        selfie_url=getattr(worker, "selfie_url", None),
        id_photo_url=getattr(worker, "id_photo_url", None),
        verification_submitted_at=getattr(worker, "verification_submitted_at", None),
    )


@router.post("/verify", response_model=WorkerRead)
def verify_worker(
    payload: dict,
    current_user: WorkerUser,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    """Submit verification documents for a worker."""
    worker = _get_worker(service, current_user)
    
    from datetime import datetime
    if 'selfie_url' in payload and payload['selfie_url']:
        worker.selfie_url = payload['selfie_url']
    if 'id_photo_url' in payload and payload['id_photo_url']:
        worker.id_photo_url = payload['id_photo_url']
    
    # Mark as verification pending
    from app.models import VerificationStatus
    worker.verification_status = VerificationStatus.PENDING
    worker.verification_submitted_at = datetime.utcnow()
    
    service.session.add(worker)
    service.session.commit()
    service.session.refresh(worker)
    
    return WorkerRead.from_orm(worker)


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    deleted = service.delete_worker(worker_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.post("/{worker_id}/experiences", response_model=ExperienceRead, status_code=status.HTTP_201_CREATED)
def create_experience(
    worker_id: UUID,
    payload: ExperienceCreate,
    service: WorkersService = Depends(get_workers_service),
) -> ExperienceRead:
    return service.add_experience(worker_id, payload)


@router.get("/{worker_id}/experiences", response_model=List[ExperienceRead])
def list_experiences(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> List[ExperienceRead]:
    try:
        return service.list_experiences(worker_id)
    except Exception as e:
        import traceback
        print(f"Error listing experiences for worker {worker_id}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing experiences: {str(e)}"
        )


@router.get("/{worker_id}/experiences/{experience_id}", response_model=ExperienceRead)
def get_experience(
    worker_id: UUID,
    experience_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> ExperienceRead:
    experience = service.get_experience(worker_id, experience_id)
    if not experience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience


@router.patch("/{worker_id}/experiences/{experience_id}", response_model=ExperienceRead)
@router.put("/{worker_id}/experiences/{experience_id}", response_model=ExperienceRead)
def update_experience(
    worker_id: UUID,
    experience_id: UUID,
    payload: ExperienceUpdate,
    service: WorkersService = Depends(get_workers_service),
) -> ExperienceRead:
    experience = service.update_experience(worker_id, experience_id, payload)
    if not experience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience


@router.delete(
    "/{worker_id}/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_experience(
    worker_id: UUID,
    experience_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    deleted = service.delete_experience(worker_id, experience_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{worker_id}/credentials", response_model=WorkerCredentialRead, status_code=status.HTTP_201_CREATED)
def create_credential(
    worker_id: UUID,
    payload: WorkerCredentialCreate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerCredentialRead:
    return service.add_credential(worker_id, payload)


@router.get("/{worker_id}/credentials", response_model=List[WorkerCredentialRead])
def list_credentials(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> List[WorkerCredentialRead]:
    return service.list_credentials(worker_id)


@router.delete(
    "/{worker_id}/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_credential(
    worker_id: UUID,
    credential_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    deleted = service.delete_credential(worker_id, credential_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post(
    "/{worker_id}/safety",
    response_model=SafetyCheckRead,
    status_code=status.HTTP_201_CREATED,
)
def submit_safety_check(
    worker_id: UUID,
    payload: SafetyCheckCreate,
    current_user: WorkerUser,
    service: WorkersService = Depends(get_workers_service),
) -> SafetyCheckRead:
    worker = _get_worker(service, current_user)
    if worker.id != worker_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot submit safety information for another worker",
        )
    return service.submit_safety_check(worker_id, payload)


@router.get(
    "/{worker_id}/safety",
    response_model=List[SafetyCheckRead],
)
def list_safety_checks(
    worker_id: UUID,
    current_user: WorkerUser,
    service: WorkersService = Depends(get_workers_service),
) -> List[SafetyCheckRead]:
    _get_worker(service, current_user)
    return service.list_safety_checks(worker_id)


@router.get(
    "/{worker_id}/safety/summary",
    response_model=List[SafetyCheckSummary],
)
def list_safety_summary(
    worker_id: UUID,
    current_user: FacilityUser,
    service: WorkersService = Depends(get_workers_service),
) -> List[SafetyCheckSummary]:
    return service.list_safety_check_summaries(worker_id)
