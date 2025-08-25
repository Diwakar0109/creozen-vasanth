"""Finalize userrole enum values to lowercase

Revision ID: 9a2794f72b3d
Revises: 2bcfde2ebdba 
Create Date: 2023-XX-XX XX:XX:XX.XXXXXX

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9a2794f72b3d' # <-- FIXED
down_revision = '2bcfde2ebdba'
branch_labels = None
depends_on = None

# These are the roles that are currently UPPERCASE and need to be renamed.
ROLES_TO_RENAME = {
    'ADMIN': 'admin',
    'DOCTOR': 'doctor',
    'NURSE': 'nurse',
    'MEDICAL_SHOP': 'medical_shop'
}

def upgrade() -> None:
    print("Renaming userrole enum values to lowercase...")
    for old_name, new_name in ROLES_TO_RENAME.items():
        op.execute(f"ALTER TYPE userrole RENAME VALUE '{old_name}' TO '{new_name}'")
    print("Enum values successfully renamed.")


def downgrade() -> None:
    print("Renaming userrole enum values back to UPPERCASE...")
    for old_name, new_name in ROLES_TO_RENAME.items():
        op.execute(f"ALTER TYPE userrole RENAME VALUE '{new_name}' TO '{old_name}'")