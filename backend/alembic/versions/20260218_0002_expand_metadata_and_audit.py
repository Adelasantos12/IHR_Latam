"""expand law metadata and audit fields

Revision ID: 20260218_0002
Revises: 20260218_0001
Create Date: 2026-02-18 01:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260218_0002"
down_revision = "20260218_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("law", sa.Column("last_amendment_date", sa.DateTime(), nullable=True))
    op.add_column("law", sa.Column("language", sa.String(), nullable=True))
    op.add_column("law", sa.Column("sector_id", sa.Integer(), nullable=True))
    op.add_column("law", sa.Column("norm_type", sa.String(), nullable=True))
    op.add_column("law", sa.Column("source_type", sa.String(), nullable=True))

    op.add_column("analysisresult", sa.Column("score", sa.Float(), nullable=False, server_default="0"))
    op.add_column("analysisresult", sa.Column("needs_review", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("analysisresult", sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()))

    op.alter_column("analysisresult", "score", server_default=None)
    op.alter_column("analysisresult", "needs_review", server_default=None)
    op.alter_column("analysisresult", "is_published", server_default=None)


def downgrade() -> None:
    op.drop_column("analysisresult", "is_published")
    op.drop_column("analysisresult", "needs_review")
    op.drop_column("analysisresult", "score")

    op.drop_column("law", "source_type")
    op.drop_column("law", "norm_type")
    op.drop_column("law", "sector_id")
    op.drop_column("law", "language")
    op.drop_column("law", "last_amendment_date")
