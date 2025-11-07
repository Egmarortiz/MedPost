"""Authentication endpoints for worker and facility flows."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status

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
    token_pair = service.register_worker(payload, ip_address=ip_address, user_agent=user_agent)
    
    print("\n=== DEBUG TOKEN PAIR ===")
    print(f"Type: {type(token_pair)}")
    print(f"access_token: {token_pair.access_token[:20]}...")
    print(f"user_id: {token_pair.user_id}")
    print(f"role: {token_pair.role} (type: {type(token_pair.role)})")
    print(f"worker_id: {token_pair.worker_id}")
    print(f"expires_at: {token_pair.expires_at} (type: {type(token_pair.expires_at)})")
    print(f"refresh_expires_at: {token_pair.refresh_expires_at}")
    
    # Try to serialize it
    try:
        dict_form = token_pair.model_dump()
        print(f"model_dump() succeeded: {dict_form.keys()}")
    except Exception as e:
        print(f"model_dump() ERROR: {e}")
    
    try:
        json_form = token_pair.model_dump_json()
        print(f"model_dump_json() succeeded, length: {len(json_form)}")
    except Exception as e:
        print(f"model_dump_json() ERROR: {e}")
    
    print("=== END DEBUG ===\n")
    
    return token_pair


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
