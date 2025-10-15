from app.models import Facility, FacilityCertification
from app.schemas import PaginationParams
from .base import SQLAlchemyRepository


class FacilityRepository(SQLAlchemyRepository[Facility]):
    def __init__(self, session: Session):
        super().__init__(Facility, session)

    def get_facility(self, facility_id: UUID) -> Optional[Facility]:
        return self.session.get(Facility, facility_id)

    def list_certifications(self, facility_id: UUID) -> List[FacilityCertification]:
        stmt = select(FacilityCertification).where(FacilityCertification.facility_id == facility_id)
        return self.session.execute(stmt).scalars().all()

    def list_facilities(self, params: Optional[PaginationParams] = None) -> List[Facility]:
        return super().list(params=params)
