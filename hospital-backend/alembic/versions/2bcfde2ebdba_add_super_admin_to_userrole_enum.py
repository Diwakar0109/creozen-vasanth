"""Add super_admin to UserRole enum (idempotent)

Revision ID: 2bcfde2ebdba
Revises: d2712c96bac5
Create Date: 2023-XX-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2bcfde2ebdba'
down_revision = 'd2712c96bac5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- THIS IS THE FIX ---
    # This command adds the 'super_admin' value ONLY IF it does not already exist.
    # This makes the migration safe to run even if the value is already present.
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'super_admin'")


def downgrade() -> None:
    # Downgrading enums is complex, we leave this empty.
    pass