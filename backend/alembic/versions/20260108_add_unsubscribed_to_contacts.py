"""
Add unsubscribed field to contacts table
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('contacts', sa.Column('unsubscribed', sa.Boolean(), nullable=False, server_default=sa.false()))

def downgrade():
    op.drop_column('contacts', 'unsubscribed')
