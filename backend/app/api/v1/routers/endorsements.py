"""REST endpoints for endorsements."""

from __future__ import annotations

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import (
    get_endorsements_service,
    require_any_role,
    require_role,
)
from app.core.security import TokenPayload
from app.models import UserRole
from app.schemas import EndorsementCreate, EndorsementRead, EndorsementUpdate
from app.services.endorsements_service import (
    EndorsementAlreadyExistsError,
    EndorsementsService,
)

router = APIRouter()

FacilityUser = Annotated[TokenPayload, Depends(require_role(UserRole.FACILITY.value))]
AnyUser = Annotated[
    TokenPayload,
    Depends(require_any_role(UserRole.WORKER.value, UserRole.FACILITY.value)),
]


def _get_user_id(payload: TokenPayload) -> UUID:
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
        )
    try:
        return UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authentication token"
        ) from exc


def _get_facility_id(service: EndorsementsService, payload: TokenPayload) -> UUID:
    user_id = _get_user_id(payload)
    facility = service.get_facility_for_user(user_id)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Facility profile not found"
        )
    return facility.id


def _get_worker_id(service: EndorsementsService, payload: TokenPayload) -> UUID:
    user_id = _get_user_id(payload)
    worker = service.get_worker_for_user(user_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Worker profile not found"
        )
    return worker.id


@router.get("/workers/{worker_id}", response_model=List[EndorsementRead])
def list_worker_endorsements(
    worker_id: UUID,
    _: AnyUser,
    service: EndorsementsService = Depends(get_endorsements_service),
) -> List[EndorsementRead]:
    endorsements = service.list_for_worker(worker_id)
    if endorsements is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return [EndorsementRead.from_orm(endorsement) for endorsement in endorsements]


@router.get("/facilities/{facility_id}", response_model=List[EndorsementRead])
def list_facility_endorsements(
    facility_id: UUID,
    _: AnyUser,
    service: EndorsementsService = Depends(get_endorsements_service),
) -> List[EndorsementRead]:
    endorsements = service.list_for_facility(facility_id)
    if endorsements is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return [EndorsementRead.from_orm(endorsement) for endorsement in endorsements]


@router.post("/", response_model=EndorsementRead, status_code=status.HTTP_201_CREATED)
def create_endorsement(
    payload: EndorsementCreate,
    current_user: FacilityUser,
    service: EndorsementsService = Depends(get_endorsements_service),
) -> EndorsementRead:
    facility_id = _get_facility_id(service, current_user)
    try:
        endorsement = service.create_endorsement(facility_id, payload)
    except EndorsementAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Facility has already endorsed this worker",
        )
    if not endorsement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return EndorsementRead.from_orm(endorsement)


@router.put("/{endorsement_id}", response_model=EndorsementRead)
def replace_endorsement(
    endorsement_id: UUID,
    payload: EndorsementUpdate,
    current_user: FacilityUser,
    service: EndorsementsService = Depends(get_endorsements_service),
) -> EndorsementRead:
    facility_id = _get_facility_id(service, current_user)
    endorsement = service.update_endorsement(endorsement_id, facility_id, payload)
    if not endorsement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endorsement not found")
    return EndorsementRead.from_orm(endorsement)


@router.patch("/{endorsement_id}", response_model=EndorsementRead)
def update_endorsement(
    endorsement_id: UUID,
    payload: EndorsementUpdate,
    current_user: FacilityUser,
    service: EndorsementsService = Depends(get_endorsements_service),
) -> EndorsementRead:
    facility_id = _get_facility_id(service, current_user)
    endorsement = service.update_endorsement(endorsement_id, facility_id, payload)
    if not endorsement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endorsement not found")
    return EndorsementRead.from_orm(endorsement)


@router.delete("/{endorsement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_endorsement(
    endorsement_id: UUID,
    current_user: Annotated[
        TokenPayload,
        Depends(require_any_role(UserRole.WORKER.value, UserRole.FACILITY.value)),
    ],
    service: EndorsementsService = Depends(get_endorsements_service),
) -> Response:
    roles = current_user.get("roles", [])
    if isinstance(roles, str):
        roles = [roles]

    if UserRole.FACILITY.value in roles:
        facility_id = _get_facility_id(service, current_user)
        deleted = service.delete_as_facility(endorsement_id, facility_id)
    elif UserRole.WORKER.value in roles:
        worker_id = _get_worker_id(service, current_user)
        deleted = service.delete_as_worker(endorsement_id, worker_id)
    else:  # pragma: no cover - defensive
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endorsement not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
