"""add pack id to grooves

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-26
"""

from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("grooves", sa.Column("pack_id", sa.String(length=80), nullable=True))


def downgrade() -> None:
    op.drop_column("grooves", "pack_id")
