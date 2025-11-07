"""Facility REST endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from pydantic import BaseModel
from sqlalchemy import or_, func, cast, String, join
from sqlalchemy.orm import Session

from app.models import Industry, Facility, FacilityAddress
from app.schemas import (
    FacilityCreate,
    FacilityFilter,
    FacilityRead,
    FacilityUpdate,
    PaginatedResponse,
)
from app.api.deps import get_facilities_service, get_pagination_params, get_current_user, get_db
from app.core.security import TokenPayload, decode_jwt
from app.schemas import PaginationParams
from app.services.facilities_service import FacilitiesService

router = APIRouter()


class FacilityVerificationRequest(BaseModel):
    id_photo_url: str
    license_id: Optional[str] = None


@router.post("/verify", response_model=FacilityRead)
def verify_facility(
    payload: FacilityVerificationRequest,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    """Submit facility verification with ID photo."""
    facility_id = current_user.get("facility_id")
    if not facility_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a facility user")
    
    facility = service.get_facility(facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    # Update facility with verification submission
    print(f"\n=== FACILITY VERIFY ENDPOINT ===")
    print(f"Facility ID: {facility_id}")
    print(f"Received payload: {payload}")
    print(f"Received id_photo_url: {payload.id_photo_url}")
    print(f"Received license_id: {payload.license_id}")
    print(f"Current facility.id_photo_url BEFORE: {facility.id_photo_url}")
    print(f"Current facility.license_id BEFORE: {facility.license_id}")
    
    facility.id_photo_url = payload.id_photo_url
    if payload.license_id:
        facility.license_id = payload.license_id
    facility.is_verified = False  # Keep as pending
    facility.verification_submitted_at = datetime.utcnow()  # Track submission time
    service.session.add(facility)
    service.session.commit()
    service.session.refresh(facility)
    
    print(f"Facility.id_photo_url AFTER: {facility.id_photo_url}")
    print(f"Facility.license_id AFTER: {facility.license_id}")
    print(f"=== END FACILITY VERIFY ===\n")
    
    return FacilityRead.from_orm(facility)


@router.get("/me", response_model=FacilityRead)
def get_current_facility(
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    """Get current facility's profile."""
    facility_id = current_user.get("facility_id")
    if not facility_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a facility user")
    
    facility = service.get_facility(facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    print(f"\n=== GET /me FACILITY PROFILE ===")
    print(f"Facility ID: {facility.id}")
    print(f"Facility Name: {facility.legal_name}")
    print(f"profile_image_url: {facility.profile_image_url}")
    print(f"id_photo_url: {facility.id_photo_url}")
    print(f"is_verified: {facility.is_verified}")
    print(f"User email: {facility.user.email if facility.user else 'No user'}")
    print(f"=== END GET /me ===\n")
    
    facility_dict = {
        'id': facility.id,
        'legal_name': facility.legal_name,
        'industry': facility.industry,
        'email': facility.user.email if facility.user else None,
        'bio': facility.bio,
        'profile_image_url': facility.profile_image_url,
        'id_photo_url': facility.id_photo_url,
        'license_id': facility.license_id,
        'phone_e164': facility.phone_e164,
        'company_size_min': facility.company_size_min,
        'company_size_max': facility.company_size_max,
        'founded_year': facility.founded_year,
        'hq_address_line1': facility.hq_address_line1,
        'hq_address_line2': facility.hq_address_line2,
        'hq_city': facility.hq_city,
        'hq_state_province': facility.hq_state_province,
        'hq_postal_code': facility.hq_postal_code,
        'hq_country': facility.hq_country,
        'is_verified': facility.is_verified,
        'created_at': facility.created_at,
        'updated_at': facility.updated_at,
        'certifications': [c for c in facility.certifications] if facility.certifications else [],
    }
    return FacilityRead(**facility_dict)


@router.patch("/me", response_model=FacilityRead)
def update_current_facility(
    update_data: FacilityUpdate,
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    """Update current facility's profile."""
    facility_id = current_user.get("facility_id")
    if not facility_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a facility user")
    
    facility = service.get_facility(facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    # Update facility with new data, excluding email
    updated_facility = service.update_facility(facility_id, update_data)
    
    print(f"\n=== PATCH /me FACILITY PROFILE ===")
    print(f"Updated Facility ID: {updated_facility.id}")
    print(f"Updated Legal Name: {updated_facility.legal_name}")
    print(f"User email from relationship: {updated_facility.user.email if updated_facility.user else 'No user'}")
    print(f"=== END PATCH /me ===\n")
    
    # Create dict with all facility data and email from user
    facility_dict = {
        'id': updated_facility.id,
        'legal_name': updated_facility.legal_name,
        'industry': updated_facility.industry,
        'email': updated_facility.user.email if updated_facility.user else None,
        'bio': updated_facility.bio,
        'profile_image_url': updated_facility.profile_image_url,
        'id_photo_url': updated_facility.id_photo_url,
        'license_id': updated_facility.license_id,
        'phone_e164': updated_facility.phone_e164,
        'company_size_min': updated_facility.company_size_min,
        'company_size_max': updated_facility.company_size_max,
        'founded_year': updated_facility.founded_year,
        'hq_address_line1': updated_facility.hq_address_line1,
        'hq_address_line2': updated_facility.hq_address_line2,
        'hq_city': updated_facility.hq_city,
        'hq_state_province': updated_facility.hq_state_province,
        'hq_postal_code': updated_facility.hq_postal_code,
        'hq_country': updated_facility.hq_country,
        'is_verified': updated_facility.is_verified,
        'created_at': updated_facility.created_at,
        'updated_at': updated_facility.updated_at,
        'certifications': [c for c in updated_facility.certifications] if updated_facility.certifications else [],
    }
    return FacilityRead(**facility_dict)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_facility(
    current_user: Annotated[TokenPayload, Depends(get_current_user)],
    service: FacilitiesService = Depends(get_facilities_service),
) -> Response:
    """Delete current facility profile."""
    facility_id_value = current_user.get("facility_id")
    
    if not facility_id_value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a facility user")
    
    try:
        if isinstance(facility_id_value, UUID):
            facility_id = facility_id_value
        else:
            facility_id = UUID(str(facility_id_value))
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid facility ID: {facility_id_value}")
    
    facility = service.get_facility(facility_id)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    
    service.session.delete(facility)
    service.session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/", response_model=PaginatedResponse[FacilityRead])
def list_facilities(
    industry: Optional[Industry] = None,
    pagination: PaginationParams = Depends(get_pagination_params),
    service: FacilitiesService = Depends(get_facilities_service),
) -> PaginatedResponse[FacilityRead]:
    filters = FacilityFilter(industry=industry)
    facilities, total = service.list_facilities(filters, pagination)
    items = [FacilityRead.from_orm(facility) for facility in facilities]
    return PaginatedResponse[FacilityRead](
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get("/search")
def search_facilities(
    q: str = "",
) -> List[dict]:
    """Search facilities by name, legal name, city, or state."""
    try:
        from app.db import get_session_factory
        SessionLocal = get_session_factory()
        db = SessionLocal()
        
        if not q or not q.strip():
            return []
        
        search_term = f"%{q.strip()}%"
        print(f"[Facilities Search] Query: '{q}', Search term: '{search_term}'")
        
        query1 = db.query(Facility).filter(
            or_(
                func.lower(cast(Facility.legal_name, String)).ilike(search_term),
                func.lower(cast(Facility.industry, String)).ilike(search_term),
                func.lower(cast(Facility.hq_city, String)).ilike(search_term),
                func.lower(cast(Facility.hq_state_province, String)).ilike(search_term),
            )
        )
        
        # Search in facility addresses
        query2 = db.query(Facility).join(FacilityAddress).filter(
            or_(
                func.lower(cast(FacilityAddress.city, String)).ilike(search_term),
                func.lower(cast(FacilityAddress.state_province, String)).ilike(search_term),
            )
        )
        
        from sqlalchemy import union_all
        combined = query1.union(query2).limit(50)
        facilities = combined.all()
        
        print(f"[Facilities Search] Found {len(facilities)} facilities matching '{q}'")
        for f in facilities:
            print(f"  - {f.legal_name} (id: {f.id})")
        
        #  Check all facilities in database
        all_facilities = db.query(Facility).all()
        print(f"[Facilities Search] Total facilities in DB: {len(all_facilities)}")
        for f in all_facilities:
            print(f"  - {f.legal_name}: hq_city={f.hq_city}, hq_state={f.hq_state_province}")
            if f.locations:
                for addr in f.locations:
                    print(f"      Address: {addr.city}, {addr.state_province}")
        
        result = []
        for facility in facilities:
            try:
                # Extract the enum value
                industry_value = facility.industry.value if facility.industry else None
                facility_dict = {
                    'id': str(facility.id),
                    'legal_name': facility.legal_name,
                    'industry': industry_value,
                    'bio': facility.bio,
                    'profile_image_url': facility.profile_image_url,
                    'city': facility.hq_city,
                    'state_province': facility.hq_state_province,
                    'phone_e164': facility.phone_e164,
                }
                result.append(facility_dict)
            except Exception as e:
                print(f"Error serializing facility {facility.id}: {e}")
                import traceback
                traceback.print_exc()
        db.close()
        return result
    except Exception as e:
        print(f"Search facilities error: {e}")
        import traceback
        traceback.print_exc()
        return []


@router.post("/", response_model=FacilityRead, status_code=status.HTTP_201_CREATED)
def create_facility(
    payload: FacilityCreate,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    facility = service.create_facility(payload)
    return FacilityRead.from_orm(facility)


@router.get("/{facility_id:path}", response_model=FacilityRead)
def get_facility(
    facility_id: str,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    try:
        fac_uuid = UUID(facility_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid facility ID format")
    
    facility = service.get_facility(fac_uuid)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return FacilityRead.from_orm(facility)


@router.patch("/{facility_id:path}", response_model=FacilityRead)
def update_facility(
    facility_id: str,
    payload: FacilityUpdate,
    service: FacilitiesService = Depends(get_facilities_service),
) -> FacilityRead:
    try:
        fac_uuid = UUID(facility_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid facility ID format")
    
    facility = service.update_facility(fac_uuid, payload)
    if not facility:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return FacilityRead.from_orm(facility)

@router.delete("/{facility_id:path}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facility(
    facility_id: str,
    service: FacilitiesService = Depends(get_facilities_service),
) -> Response:
    try:
        fac_uuid = UUID(facility_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid facility ID format")
    
    deleted = service.delete_facility(fac_uuid)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facility not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
