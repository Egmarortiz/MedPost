"""Authentication and authorization service layer."""

from __future__ import annotations

import datetime as dt
import hashlib
import secrets
from typing import Optional, Tuple
from uuid import UUID

import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.settings import Settings, get_settings
from app.models import (
    AuthAuditLog,
    AuthEventType,
    Facility,
    RefreshToken,
    User,
    UserRole,
    Worker,
)
from app.repositories import RefreshTokenRepository, UserRepository
from app.schemas import (
    FacilityRegistrationRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenPair,
    WorkerRegistrationRequest,
)


class AuthService:
    """Service encapsulating password hashing, token minting and auditing."""

    def __init__(self, session: Session, settings: Optional[Settings] = None):
        self.session = session
        self.settings = settings or get_settings()
        self.user_repo = UserRepository(session)
        self.refresh_repo = RefreshTokenRepository(session)
        self.password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # ------------------------------------------------------------------
    # Registration flows
    # ------------------------------------------------------------------
    def register_worker(
        self,
        payload: WorkerRegistrationRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenPair:
        self._ensure_email_available(payload.email)

        user = User(
            email=payload.email.lower(),
            hashed_password=self._hash_password(payload.password.get_secret_value()),
            role=UserRole.WORKER,
        )
        
        self.session.add(user)
        self.session.flush()
        
        # Create worker with user_id
        worker = Worker(
            user_id=user.id,
            full_name=payload.full_name,
            title=payload.title,
            bio=payload.bio,
            profile_image_url=str(payload.profile_image_url) if payload.profile_image_url else None,
            resume_url=str(payload.resume_url) if payload.resume_url else None,
            city=payload.city,
            state_province=payload.state_province,
            postal_code=payload.postal_code,
            phone=payload.phone,
            education_level=payload.education_level,
        )

        self.session.add(worker)
        self.session.flush()

        token_pair, refresh_obj = self._issue_token_pair(
            user,
            ip_address=ip_address,
            user_agent=user_agent,
            worker_id=worker.id,
        )

        self._log_event(user, AuthEventType.REGISTRATION, refresh_obj, ip_address, user_agent)
        self.session.commit()
        return token_pair

    def register_facility(
        self,
        payload: FacilityRegistrationRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenPair:
        self._ensure_email_available(payload.email)

        user = User(
            email=payload.email.lower(),
            hashed_password=self._hash_password(payload.password.get_secret_value()),
            role=UserRole.FACILITY,
        )

        self.session.add(user)
        self.session.flush()
        
        facility = Facility(
            user_id=user.id,
            legal_name=payload.legal_name,
            industry=payload.industry,
            bio=payload.bio,
            profile_image_url=str(payload.profile_image_url) if payload.profile_image_url else None,
            phone_e164=payload.phone_e164,
            company_size_min=payload.company_size_min,
            company_size_max=payload.company_size_max,
            founded_year=payload.founded_year,
            hq_address_line1=payload.hq_address_line1,
            hq_address_line2=payload.hq_address_line2,
            hq_city=payload.hq_city,
            hq_state_province=payload.hq_state_province,
            hq_postal_code=payload.hq_postal_code,
            hq_country=payload.hq_country,
        )

        self.session.add(facility)
        self.session.flush()
        self.session.refresh(user)
        
        print(f"\n=== FACILITY REGISTRATION DEBUG ===")
        print(f"User ID: {user.id}")
        print(f"Facility ID: {facility.id}")
        print(f"User facility_profile: {user.facility_profile}")
        print(f"User facility_profile ID: {user.facility_profile.id if user.facility_profile else None}")
        print(f"=== END REGISTRATION DEBUG ===\n")

        token_pair, refresh_obj = self._issue_token_pair(
            user,
            ip_address=ip_address,
            user_agent=user_agent,
            facility_id=facility.id,
        )

        self._log_event(user, AuthEventType.REGISTRATION, refresh_obj, ip_address, user_agent)
        self.session.commit()
        return token_pair

    # ------------------------------------------------------------------
    # Login flows
    # ------------------------------------------------------------------
    def login_worker(
        self,
        payload: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenPair:
        user = self._authenticate(payload)
        if user.role != UserRole.WORKER:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not a worker")
        if not user.worker_profile:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Worker profile is missing")

        token_pair, refresh_obj = self._issue_token_pair(
            user,
            ip_address=ip_address,
            user_agent=user_agent,
            worker_id=user.worker_profile.id,
        )
        self.user_repo.set_last_login(user)
        self._log_event(user, AuthEventType.LOGIN, refresh_obj, ip_address, user_agent)
        self.session.commit()
        return token_pair

    def login_facility(
        self,
        payload: LoginRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenPair:
        user = self._authenticate(payload)
        if user.role != UserRole.FACILITY:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is not a facility")
        if not user.facility_profile:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Facility profile is missing")

        token_pair, refresh_obj = self._issue_token_pair(
            user,
            ip_address=ip_address,
            user_agent=user_agent,
            facility_id=user.facility_profile.id,
        )
        self.user_repo.set_last_login(user)
        self._log_event(user, AuthEventType.LOGIN, refresh_obj, ip_address, user_agent)
        self.session.commit()
        return token_pair

    # ------------------------------------------------------------------
    # Token lifecycle operations
    # ------------------------------------------------------------------
    def refresh_session(
        self,
        payload: RefreshRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> TokenPair:
        token_hash = self._hash_token(payload.refresh_token.get_secret_value())
        stored = self.refresh_repo.get_by_hash(token_hash)
        if not stored or stored.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

        now = self._now()
        expires_at = self._ensure_utc(stored.expires_at)
        if expires_at < now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

        user = stored.user
        worker_id, facility_id = self._profile_ids(user)

        token_pair, new_refresh = self._issue_token_pair(
            user,
            ip_address=ip_address,
            user_agent=user_agent,
            worker_id=worker_id,
            facility_id=facility_id,
        )

        stored.revoked_at = now
        stored.revoked_reason = "rotated"
        stored.replaced_by_token_id = new_refresh.id
        self._log_event(user, AuthEventType.REFRESH, new_refresh, ip_address, user_agent)
        self.session.commit()
        return token_pair

    def logout(
        self,
        payload: LogoutRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        token_hash = self._hash_token(payload.refresh_token.get_secret_value())
        stored = self.refresh_repo.get_by_hash(token_hash)
        now = self._now()

        if not stored:
            # Unknown token - still create an audit trail for observability.
            audit = AuthAuditLog(
                user_id=None,
                event_type=AuthEventType.LOGOUT,
                ip_address=ip_address,
                user_agent=user_agent,
                detail="Attempted logout with unknown refresh token",
            )
            self.session.add(audit)
            self.session.commit()
            return

        if stored.revoked_at is None:
            stored.revoked_at = now
            stored.revoked_reason = "user_logout"

        self._log_event(stored.user, AuthEventType.LOGOUT, stored, ip_address, user_agent)
        self.session.commit()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _ensure_email_available(self, email: str) -> None:
        if self.user_repo.get_by_email(email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    def _authenticate(self, payload: LoginRequest) -> User:
        user = self.user_repo.get_by_email(payload.email)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")
        # Truncate password to 72 bytes (bcrypt limit)
        password_bytes = payload.password.get_secret_value()[:72]
        if not self.password_context.verify(password_bytes, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        return user

    def _hash_password(self, password: str) -> str:
        # Truncate password to 72 bytes (bcrypt limit)
        password_truncated = password[:72]
        return self.password_context.hash(password_truncated)

    def _issue_token_pair(
        self,
        user: User,
        *,
        ip_address: Optional[str],
        user_agent: Optional[str],
        worker_id: Optional[UUID] = None,
        facility_id: Optional[UUID] = None,
    ) -> Tuple[TokenPair, RefreshToken]:
        now = self._now()
        access_exp = now + dt.timedelta(minutes=self.settings.access_token_expire_minutes)
        refresh_exp = now + dt.timedelta(days=self.settings.refresh_token_expire_days)

        print(f"\n=== _issue_token_pair DEBUG ===")
        print(f"User ID: {user.id}")
        print(f"Worker ID param: {worker_id}")
        print(f"Facility ID param: {facility_id} (type: {type(facility_id).__name__ if facility_id else 'None'})")
        print(f"User role: {user.role}")

        payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "roles": [user.role.value],
            "iat": int(now.timestamp()),
            "exp": int(access_exp.timestamp()),
            "type": "access",
        }
        if worker_id:
            print(f"Adding worker_id to token: {worker_id}")
            payload["worker_id"] = str(worker_id)
        if facility_id:
            print(f"Adding facility_id to token: {facility_id}")
            payload["facility_id"] = str(facility_id)
        else:
            print(f"NOT adding facility_id to token (facility_id is falsy)")
        
        print(f"Final payload keys: {list(payload.keys())}")
        print(f"=== END _issue_token_pair DEBUG ===\n")
        
        access_token = jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

        refresh_token_plain = secrets.token_urlsafe(48)
        refresh_obj = RefreshToken(
            user_id=user.id,
            token_hash=self._hash_token(refresh_token_plain),
            expires_at=refresh_exp,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.session.add(refresh_obj)
        self.session.flush()

        token_pair = TokenPair(
            access_token=access_token,
            refresh_token=refresh_token_plain,
            expires_at=access_exp,
            refresh_expires_at=refresh_exp,
            user_id=user.id,
            role=user.role,
            worker_id=worker_id,
            facility_id=facility_id,
        )
        return token_pair, refresh_obj

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def _log_event(
        self,
        user: User,
        event_type: AuthEventType,
        refresh_token: Optional[RefreshToken],
        ip_address: Optional[str],
        user_agent: Optional[str],
    ) -> None:
        log = AuthAuditLog(
            user_id=user.id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            refresh_token_id=refresh_token.id if refresh_token else None,
        )
        self.session.add(log)

    def _profile_ids(self, user: User) -> Tuple[Optional[UUID], Optional[UUID]]:
        worker_id = user.worker_profile.id if user.worker_profile else None
        facility_id = user.facility_profile.id if user.facility_profile else None
        return worker_id, facility_id

    @staticmethod
    def _now() -> dt.datetime:
        return dt.datetime.now(dt.timezone.utc)

    @staticmethod
    def _ensure_utc(value: dt.datetime) -> dt.datetime:
        """Normalize database datetimes to timezone-aware UTC for safe comparison."""

        if value.tzinfo is None:
            return value.replace(tzinfo=dt.timezone.utc)
        return value.astimezone(dt.timezone.utc)
