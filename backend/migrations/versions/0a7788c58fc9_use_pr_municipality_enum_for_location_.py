"""Use PR municipality enum for location fields

Revision ID: 0a7788c58fc9
Revises: 6b8fa98a857f
Create Date: 2025-10-21 03:31:35.543521

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a7788c58fc9'
down_revision: Union[str, None] = '6b8fa98a857f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MUNICIPALITY_ENUM_NAME = "puertoricomunicipality"

MUNICIPALITY_LABEL_TO_ENUM = {
    "Adjuntas": "ADJUNTAS",
    "Aguada": "AGUADA",
    "Aguadilla": "AGUADILLA",
    "Aguas Buenas": "AGUAS_BUENAS",
    "Aibonito": "AIBONITO",
    "Añasco": "ANASCO",
    "Arecibo": "ARECIBO",
    "Arroyo": "ARROYO",
    "Barceloneta": "BARCELONETA",
    "Barranquitas": "BARRANQUITAS",
    "Bayamón": "BAYAMON",
    "Cabo Rojo": "CABO_ROJO",
    "Caguas": "CAGUAS",
    "Camuy": "CAMUY",
    "Canóvanas": "CANOVANAS",
    "Carolina": "CAROLINA",
    "Cataño": "CATANO",
    "Cayey": "CAYEY",
    "Ceiba": "CEIBA",
    "Ciales": "CIALES",
    "Cidra": "CIDRA",
    "Coamo": "COAMO",
    "Comerío": "COMERIO",
    "Corozal": "COROZAL",
    "Culebra": "CULEBRA",
    "Dorado": "DORADO",
    "Fajardo": "FAJARDO",
    "Florida": "FLORIDA",
    "Guánica": "GUANICA",
    "Guayama": "GUAYAMA",
    "Guayanilla": "GUAYANILLA",
    "Guaynabo": "GUAYNABO",
    "Gurabo": "GURABO",
    "Hatillo": "HATILLO",
    "Hormigueros": "HORMIGUEROS",
    "Humacao": "HUMACAO",
    "Isabela": "ISABELA",
    "Jayuya": "JAYUYA",
    "Juana Díaz": "JUANA_DIAZ",
    "Juncos": "JUNCOS",
    "Lajas": "LAJAS",
    "Lares": "LARES",
    "Las Marías": "LAS_MARIAS",
    "Las Piedras": "LAS_PIEDRAS",
    "Loíza": "LOIZA",
    "Luquillo": "LUQUILLO",
    "Manatí": "MANATI",
    "Maricao": "MARICAO",
    "Maunabo": "MAUNABO",
    "Mayagüez": "MAYAGUEZ",
    "Moca": "MOCA",
    "Morovis": "MOROVIS",
    "Naguabo": "NAGUABO",
    "Naranjito": "NARANJITO",
    "Orocovis": "OROCOVIS",
    "Patillas": "PATILLAS",
    "Peñuelas": "PENUELAS",
    "Ponce": "PONCE",
    "Quebradillas": "QUEBRADILLAS",
    "Rincón": "RINCON",
    "Río Grande": "RIO_GRANDE",
    "Sabana Grande": "SABANA_GRANDE",
    "Salinas": "SALINAS",
    "San Germán": "SAN_GERMAN",
    "San Juan": "SAN_JUAN",
    "San Lorenzo": "SAN_LORENZO",
    "San Sebastián": "SAN_SEBASTIAN",
    "Santa Isabel": "SANTA_ISABEL",
    "Toa Alta": "TOA_ALTA",
    "Toa Baja": "TOA_BAJA",
    "Trujillo Alto": "TRUJILLO_ALTO",
    "Utuado": "UTUADO",
    "Vega Alta": "VEGA_ALTA",
    "Vega Baja": "VEGA_BAJA",
    "Vieques": "VIEQUES",
    "Villalba": "VILLALBA",
    "Yabucoa": "YABUCOA",
    "Yauco": "YAUCO",
}


def _municipality_enum(create_type: bool = False) -> sa.Enum:
    return sa.Enum(
        "ADJUNTAS",
        "AGUADA",
        "AGUADILLA",
        "AGUAS_BUENAS",
        "AIBONITO",
        "ANASCO",
        "ARECIBO",
        "ARROYO",
        "BARCELONETA",
        "BARRANQUITAS",
        "BAYAMON",
        "CABO_ROJO",
        "CAGUAS",
        "CAMUY",
        "CANOVANAS",
        "CAROLINA",
        "CATANO",
        "CAYEY",
        "CEIBA",
        "CIALES",
        "CIDRA",
        "COAMO",
        "COMERIO",
        "COROZAL",
        "CULEBRA",
        "DORADO",
        "FAJARDO",
        "FLORIDA",
        "GUANICA",
        "GUAYAMA",
        "GUAYANILLA",
        "GUAYNABO",
        "GURABO",
        "HATILLO",
        "HORMIGUEROS",
        "HUMACAO",
        "ISABELA",
        "JAYUYA",
        "JUANA_DIAZ",
        "JUNCOS",
        "LAJAS",
        "LARES",
        "LAS_MARIAS",
        "LAS_PIEDRAS",
        "LOIZA",
        "LUQUILLO",
        "MANATI",
        "MARICAO",
        "MAUNABO",
        "MAYAGUEZ",
        "MOCA",
        "MOROVIS",
        "NAGUABO",
        "NARANJITO",
        "OROCOVIS",
        "PATILLAS",
        "PENUELAS",
        "PONCE",
        "QUEBRADILLAS",
        "RINCON",
        "RIO_GRANDE",
        "SABANA_GRANDE",
        "SALINAS",
        "SAN_GERMAN",
        "SAN_JUAN",
        "SAN_LORENZO",
        "SAN_SEBASTIAN",
        "SANTA_ISABEL",
        "TOA_ALTA",
        "TOA_BAJA",
        "TRUJILLO_ALTO",
        "UTUADO",
        "VEGA_ALTA",
        "VEGA_BAJA",
        "VIEQUES",
        "VILLALBA",
        "YABUCOA",
        "YAUCO",
        name=MUNICIPALITY_ENUM_NAME,
        create_type=create_type,
    )


def _normalize_city_values(table_name: str, column_name: str) -> None:
    for label, enum_name in MUNICIPALITY_LABEL_TO_ENUM.items():
        op.execute(
            sa.text(
                f"UPDATE {table_name} "
                f"SET {column_name} = :enum_name "
                f"WHERE lower({column_name}) = :label_lower"
            ),
            {"enum_name": enum_name, "label_lower": label.lower()},
        )


def upgrade() -> None:
enum_type = _municipality_enum(create_type=True)
    bind = op.get_bind()
    enum_type.create(bind, checkfirst=True)

    enum_for_columns = _municipality_enum()

    _normalize_city_values("facilities", "hq_city")
    _normalize_city_values("facility_addresses", "city")
    _normalize_city_values("job_posts", "city")
    _normalize_city_values("workers", "city")

    op.alter_column(
        "facilities",
        "hq_city",
        existing_type=sa.VARCHAR(length=120),
        type_=enum_for_columns,
        existing_nullable=True,
        postgresql_using=f"hq_city::{MUNICIPALITY_ENUM_NAME}",
    )
    op.alter_column(
        "facilities",
        "hq_state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default="Puerto Rico",
        existing_nullable=True,
    )
    op.alter_column(
        "facilities",
        "hq_country",
        existing_type=sa.VARCHAR(length=120),
        server_default="US",
        existing_nullable=True,
    )
    op.alter_column(
        "facility_addresses",
        "city",
        existing_type=sa.VARCHAR(length=120),
        type_=enum_for_columns,
        existing_nullable=True,
        postgresql_using=f"city::{MUNICIPALITY_ENUM_NAME}",
    )
    op.alter_column(
        "facility_addresses",
        "state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default="Puerto Rico",
        existing_nullable=True,
    )
    op.alter_column(
        "facility_addresses",
        "country",
        existing_type=sa.VARCHAR(length=120),
        server_default="US",
        existing_nullable=True,
    )
    op.alter_column(
        "job_posts",
        "city",
        existing_type=sa.VARCHAR(length=120),
        type_=enum_for_columns,
        existing_nullable=True,
        postgresql_using=f"city::{MUNICIPALITY_ENUM_NAME}",
    )
    op.alter_column(
        "job_posts",
        "state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default="Puerto Rico",
        existing_nullable=True,
    )
    op.alter_column(
        "workers",
        "city",
        existing_type=sa.VARCHAR(length=120),
        type_=enum_for_columns,
        existing_nullable=True,
        postgresql_using=f"city::{MUNICIPALITY_ENUM_NAME}",
    )
    op.alter_column(
        "workers",
        "state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default="Puerto Rico",
        existing_nullable=True,
    )

def downgrade() -> None:
    op.alter_column(
        "workers",
        "state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        "workers",
        "city",
        existing_type=_municipality_enum(),
        type_=sa.VARCHAR(length=120),
        existing_nullable=True,
        postgresql_using="city::text",
    )
    op.alter_column(
        "job_posts",
        "state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        "job_posts",
        "city",
        existing_type=_municipality_enum(),
        type_=sa.VARCHAR(length=120),
        existing_nullable=True,
        postgresql_using="city::text",
    )
    op.alter_column(
        "facility_addresses",
        "country",
        existing_type=sa.VARCHAR(length=120),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        "facility_addresses",
        "state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        "facility_addresses",
        "city",
        existing_type=_municipality_enum(),
        type_=sa.VARCHAR(length=120),
        existing_nullable=True,
        postgresql_using="city::text",
    )
    op.alter_column(
        "facilities",
        "hq_country",
        existing_type=sa.VARCHAR(length=120),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        "facilities",
        "hq_state_province",
        existing_type=sa.VARCHAR(length=120),
        server_default=None,
        existing_nullable=True,
    )
    op.alter_column(
        "facilities",
        "hq_city",
        existing_type=_municipality_enum(),
        type_=sa.VARCHAR(length=120),
        existing_nullable=True,
        postgresql_using="hq_city::text",
    )

    enum_type = _municipality_enum()
    bind = op.get_bind()
    enum_type.drop(bind, checkfirst=True)
