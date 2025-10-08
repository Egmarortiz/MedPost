import strawberry
from datetime import datetime
from typing import Optional

@strawberry.type
class FacilityType:
    id: str
    name: str
    location: str
    email: Optional[str]
    phone_number: Optional[str]
    created_at: datetime
    updated_at: datetime


@strawberry.input
class FacilityInput:
    name: str
    location: str
    email: Optional[str] = None
    phone_number: Optional[str] = None


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_facility(self, input: FacilityInput) -> FacilityType:
        return FacilityType(
            id="uuid",
            name=input.name,
            location=input.location,
            email=input.email,
            phone_number=input.phone_number,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    @strawberry.mutation
    async def update_facility(self, id: str, input: FacilityInput) -> FacilityType:
        return FacilityType(
            id=id,
            name=input.name,
            location=input.location,
            email=input.email,
            phone_number=input.phone_number,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    @strawberry.mutation
    async def delete_facility(self, id: str) -> bool:
        return True


schema = strawberry.Schema(mutation=Mutation)