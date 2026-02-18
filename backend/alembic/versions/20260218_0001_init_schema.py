"""init schema

Revision ID: 20260218_0001
Revises:
Create Date: 2026-02-18 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision = "20260218_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "country",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "obligation",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("ihr_provision", sa.String(), nullable=False),
        sa.Column("normative_content", sa.String(), nullable=False),
        sa.Column("required_domestic_functions", sa.String(), nullable=False),
        sa.Column("observance", sa.String(), nullable=False),
        sa.Column("compliance_indicator", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "law",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("country_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("publication_date", sa.DateTime(), nullable=True),
        sa.Column("url", sa.String(), nullable=True),
        sa.Column("file_path", sa.String(), nullable=True),
        sa.Column("full_text", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["country_id"], ["country.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "authority",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("country_id", sa.String(), nullable=False),
        sa.Column("authority_name", sa.String(), nullable=False),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["country_id"], ["country.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_authority_country_id", "authority", ["country_id"], unique=True)

    op.create_table(
        "lawchunk",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("law_id", sa.Integer(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(), nullable=False),
        sa.Column("embedding", Vector(dim=1536), nullable=True),
        sa.ForeignKeyConstraint(["law_id"], ["law.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "analysisresult",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("country_id", sa.String(), nullable=False),
        sa.Column("obligation_id", sa.String(), nullable=False),
        sa.Column("status", sa.Enum("YES", "NO", "PARTIAL", "UNKNOWN", name="compliancestatus"), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("evidence", sa.JSON(), nullable=True),
        sa.Column("missing_info", sa.JSON(), nullable=True),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["country_id"], ["country.id"]),
        sa.ForeignKeyConstraint(["obligation_id"], ["obligation.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("analysisresult")
    op.drop_table("lawchunk")
    op.drop_index("ix_authority_country_id", table_name="authority")
    op.drop_table("authority")
    op.drop_table("law")
    op.drop_table("obligation")
    op.drop_table("country")
    op.execute("DROP TYPE IF EXISTS compliancestatus")
