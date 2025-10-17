"""Authentication endpoints."""

from __future__ import annotations

from app.api.deps import get_auth_service
from app.schemas import (
    FacilityRegistrationRequest,
    LoginRequest,
    LogoutRequest,
    Message,
    RefreshRequest,
    TokenPair,
    WorkerRegistrationRequest,
)
from app.services import AuthService

router = APIRouter(tags=["auth"])

def _client_context(request: Request) -> tuple[str | None, str | None]:
    client_host = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return client_host, user_agent


@router.post("/worker/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register_worker(
    payload: WorkerRegistrationRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    ip_address, user_agent = _client_context(request)
    return service.register_worker(payload, ip_address=ip_address, user_agent=user_agent)


@router.post("/worker/login", response_model=TokenPair)
def login_worker(
    payload: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    ip_address, user_agent = _client_context(request)
    return service.login_worker(payload, ip_address=ip_address, user_agent=user_agent)


@router.post("/facility/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register_facility(
    payload: FacilityRegistrationRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    ip_address, user_agent = _client_context(request)
    return service.register_facility(payload, ip_address=ip_address, user_agent=user_agent)


@router.post("/facility/login", response_model=TokenPair)
def login_facility(
    payload: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    ip_address, user_agent = _client_context(request)
    return service.login_facility(payload, ip_address=ip_address, user_agent=user_agent)


@router.post("/refresh", response_model=TokenPair)
def refresh_token(
    payload: RefreshRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenPair:
    ip_address, user_agent = _client_context(request)
    return service.refresh_session(payload, ip_address=ip_address, user_agent=user_agent)


@router.post("/logout", response_model=Message)
def logout(
    payload: LogoutRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> Message:
    ip_address, user_agent = _client_context(request)
    service.logout(payload, ip_address=ip_address, user_agent=user_agent)
    return Message(detail="Logged out")
