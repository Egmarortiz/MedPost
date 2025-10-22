"""Core application utilities."""

from .locations import (
    DEFAULT_COUNTRY,
    DEFAULT_STATE_PROVINCE,
    PUERTO_RICO_MUNICIPALITIES,
    PuertoRicoMunicipality,
)
from .settings import Settings, get_settings

__all__ = [
    "Settings",
    "get_settings",
    "PuertoRicoMunicipality",
    "PUERTO_RICO_MUNICIPALITIES",
    "DEFAULT_STATE_PROVINCE",
    "DEFAULT_COUNTRY",
]
