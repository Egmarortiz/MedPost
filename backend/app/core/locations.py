"""Location constants and helpers for Puerto Rico."""

from __future__ import annotations

from enum import Enum
from typing import Tuple


class PuertoRicoMunicipality(str, Enum):
    """Enumerates the 78 municipios of Puerto Rico."""

    ADJUNTAS = "Adjuntas"
    AGUADA = "Aguada"
    AGUADILLA = "Aguadilla"
    AGUAS_BUENAS = "Aguas Buenas"
    AIBONITO = "Aibonito"
    ANASCO = "Añasco"
    ARECIBO = "Arecibo"
    ARROYO = "Arroyo"
    BARCELONETA = "Barceloneta"
    BARRANQUITAS = "Barranquitas"
    BAYAMON = "Bayamón"
    CABO_ROJO = "Cabo Rojo"
    CAGUAS = "Caguas"
    CAMUY = "Camuy"
    CANOVANAS = "Canóvanas"
    CAROLINA = "Carolina"
    CATANO = "Cataño"
    CAYEY = "Cayey"
    CEIBA = "Ceiba"
    CIALES = "Ciales"
    CIDRA = "Cidra"
    COAMO = "Coamo"
    COMERIO = "Comerío"
    COROZAL = "Corozal"
    CULEBRA = "Culebra"
    DORADO = "Dorado"
    FAJARDO = "Fajardo"
    FLORIDA = "Florida"
    GUANICA = "Guánica"
    GUAYAMA = "Guayama"
    GUAYANILLA = "Guayanilla"
    GUAYNABO = "Guaynabo"
    GURABO = "Gurabo"
    HATILLO = "Hatillo"
    HORMIGUEROS = "Hormigueros"
    HUMACAO = "Humacao"
    ISABELA = "Isabela"
    JAYUYA = "Jayuya"
    JUANA_DIAZ = "Juana Díaz"
    JUNCOS = "Juncos"
    LAJAS = "Lajas"
    LARES = "Lares"
    LAS_MARIAS = "Las Marías"
    LAS_PIEDRAS = "Las Piedras"
    LOIZA = "Loíza"
    LUQUILLO = "Luquillo"
    MANATI = "Manatí"
    MARICAO = "Maricao"
    MAUNABO = "Maunabo"
    MAYAGUEZ = "Mayagüez"
    MOCA = "Moca"
    MOROVIS = "Morovis"
    NAGUABO = "Naguabo"
    NARANJITO = "Naranjito"
    OROCOVIS = "Orocovis"
    PATILLAS = "Patillas"
    PENUELAS = "Peñuelas"
    PONCE = "Ponce"
    QUEBRADILLAS = "Quebradillas"
    RINCON = "Rincón"
    RIO_GRANDE = "Río Grande"
    SABANA_GRANDE = "Sabana Grande"
    SALINAS = "Salinas"
    SAN_GERMAN = "San Germán"
    SAN_JUAN = "San Juan"
    SAN_LORENZO = "San Lorenzo"
    SAN_SEBASTIAN = "San Sebastián"
    SANTA_ISABEL = "Santa Isabel"
    TOA_ALTA = "Toa Alta"
    TOA_BAJA = "Toa Baja"
    TRUJILLO_ALTO = "Trujillo Alto"
    UTUADO = "Utuado"
    VEGA_ALTA = "Vega Alta"
    VEGA_BAJA = "Vega Baja"
    VIEQUES = "Vieques"
    VILLALBA = "Villalba"
    YABUCOA = "Yabucoa"
    YAUCO = "Yauco"


PUERTO_RICO_MUNICIPALITIES: Tuple[str, ...] = tuple(
    municipality.value for municipality in PuertoRicoMunicipality
)

DEFAULT_STATE_PROVINCE = "Puerto Rico"
DEFAULT_COUNTRY = "US"

__all__ = [
    "PuertoRicoMunicipality",
    "PUERTO_RICO_MUNICIPALITIES",
    "DEFAULT_STATE_PROVINCE",
    "DEFAULT_COUNTRY",
]
