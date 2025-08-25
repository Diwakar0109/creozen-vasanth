"""add created_at and updated_at to prescriptions

Revision ID: d2314936284f
Revises: 2f36bb4aaa50
Create Date: 2025-08-22 23:54:45.995391

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2314936284f'
down_revision: Union[str, Sequence[str], None] = '2f36bb4aaa50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
