#!/bin/bash/env python3
"""Worker CRUD functions"""

from sqlalchemy.orm import Session
from uuid import UUID
from ..models.worker import Worker
from ..schemas.worker import WorkerCreate