"""Assign orphaned users and patients to default hospital

Revision ID: f6668834a4fd
Revises: 6bd1371c8564
Create Date: 2025-08-24 10:16:14.628814

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6668834a4fd'
down_revision: Union[str, Sequence[str], None] = '6bd1371c8564'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- THIS IS THE FIX ---
    # We add the data update commands here.
    # It finds all users (except super_admin) and all patients that
    # do not have a hospital_id and assigns them to hospital_id = 1.
    print("Assigning orphaned users and patients to hospital with ID=1...")
    
    op.execute(
        "UPDATE users SET hospital_id = 1 WHERE hospital_id IS NULL AND role != 'super_admin'"
    )
    op.execute(
        "UPDATE patients SET hospital_id = 1 WHERE hospital_id IS NULL"
    )
    
    print("Orphaned records updated successfully.")


def downgrade() -> None:
    # --- (Optional) Add the reverse operation ---
    # This isn't strictly necessary for a data migration, but it's good practice.
    print("Setting hospital_id back to NULL for previously orphaned records (informational).")
    
    # We can't know for sure which ones were originally orphaned,
    # so the downgrade is just for reversing the entire operation if needed.
    # In a real-world scenario, you might be more specific.
    op.execute("UPDATE users SET hospital_id = NULL WHERE role != 'super_admin'")
    op.execute("UPDATE patients SET hospital_id = NULL")