"""Merge final data model changes

Revision ID: 6bd1371c8564
Revises: 4d83457e3989, 9a2794f72b3d
Create Date: 2025-08-24 09:35:53.972363

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6bd1371c8564'
down_revision: Union[str, Sequence[str], None] = ('4d83457e3989', '9a2794f72b3d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
