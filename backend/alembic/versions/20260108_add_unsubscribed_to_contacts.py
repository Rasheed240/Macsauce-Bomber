"""Add unsubscribed field to contacts table

Revision ID: 20260108_0002
Revises: 20260108_0001
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260108_0002'
down_revision = '20260108_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if column exists before adding
    from sqlalchemy import inspect

    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('contacts')]

    if 'unsubscribed' not in columns:
        op.add_column('contacts', sa.Column('unsubscribed', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column('contacts', 'unsubscribed')
