"""Worker REST endpoints."""

from __future__ import annotations

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core import PuertoRicoMunicipality
from app.core.security import TokenPayload
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
)
from app.schemas.common import PaginationParams
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
    filters = WorkerFilter(
        title=title,
        city=city,
        education_level=education_level,
        has_endorsements=has_endorsements,
    )
    workers, total = service.list_workers(filters, pagination)
    items = [WorkerRead.from_orm(worker) for worker in workers]
    return PaginatedResponse[WorkerRead](
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )

@router.post("/", response_model=WorkerRead, status_code=status.HTTP_201_CREATED)
def create_worker(
    payload: WorkerCreate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.create_worker(payload)
    return WorkerRead.from_orm(worker)


@router.get("/{worker_id}", response_model=WorkerRead)
def get_worker(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.get_worker(worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return WorkerRead.from_orm(worker)


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
    return service.list_experiences(worker_id)


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
