"""Add attachments column to campaigns table

Revision ID: 20260110_0001
Revises: 20260108_0002
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = '20260110_0001'
down_revision = '20260108_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if column exists before adding
    from sqlalchemy import inspect

    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('campaigns')]

    if 'attachments' not in columns:
        op.add_column('campaigns', sa.Column('attachments', JSON, nullable=True))


def downgrade() -> None:
    op.drop_column('campaigns', 'attachments')
