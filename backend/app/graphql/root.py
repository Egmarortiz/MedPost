"""Unifies workers and jobs modules"""

import strawberry
from app.graphql.worker_schema import Query as WorkerQuery, Mutation as WorkerMutation
from app.graphql.jobs_schema import Query as JobQuery, Mutation as JobMutation
from app.graphql.facility_schema import Mutation as FacilityMutation

@strawberry.type
class Query(WorkerQuery, JobQuery):
    pass


@strawberry.type
class Mutation(WorkerMutation, JobMutation):
    pass

@strawberry.type
class Mutation(WorkerMutation, JobMutation, FacilityMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
