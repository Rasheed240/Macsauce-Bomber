"""
Add scheduled_at to campaigns table (if not present)
"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('campaigns', sa.Column('scheduled_at', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('campaigns', 'scheduled_at')
