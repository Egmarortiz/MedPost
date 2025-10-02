"""
Import models once so SQLAlchemy registers all mappers on Base.metadata.

This is important for:
- Base.metadata.create_all(bind=engine)
- Alembic autogenerate (env.py -> target_metadata = Base.metadata)
"""

from .base_model import Base  # re-export Base
# side-effect imports: register all model classes with Base.metadata
from . import worker as _worker  # noqa: F401
from . import facility as _facility  # noqa: F401
from . import jobs as _jobs         # noqa: F401
