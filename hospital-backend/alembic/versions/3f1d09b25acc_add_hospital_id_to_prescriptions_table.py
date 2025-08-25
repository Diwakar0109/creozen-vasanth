"""Add hospital_id to prescriptions table

Revision ID: 3f1d09b25acc
Revises: 161426f9cf07
Create Date: 2025-08-24 16:09:25.195406

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f1d09b25acc'
down_revision: Union[str, Sequence[str], None] = '161426f9cf07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- THIS IS THE FIX ---
    # Stage 1: Add the new column, but allow it to be NULL for now.
    print("Stage 1: Adding nullable hospital_id column to prescriptions table...")
    op.add_column('prescriptions', sa.Column('hospital_id', sa.Integer(), nullable=True))

    # Stage 2: Populate the new hospital_id by joining through the doctor (users table).
    print("Stage 2: Populating hospital_id for existing prescriptions...")
    op.execute(
        """
        UPDATE prescriptions AS p
        SET hospital_id = u.hospital_id
        FROM users AS u
        WHERE p.doctor_id = u.id AND p.hospital_id IS NULL
        """
    )

    # Stage 3: Now that all rows have a value, alter the column to be NOT NULL.
    # It's safer to only do this if all prescriptions were successfully updated.
    # For simplicity in development, we'll assume they were.
    print("Stage 3: Making hospital_id column on prescriptions non-nullable...")
    op.alter_column('prescriptions', 'hospital_id', nullable=False)

    # Create the foreign key constraint with ON DELETE CASCADE
    print("Stage 4: Creating foreign key constraint...")
    op.create_foreign_key(
        'fk_prescriptions_hospital_id', # A name for the constraint
        'prescriptions', 'hospitals', 
        ['hospital_id'], ['id'], 
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Revert the changes in reverse order
    op.drop_constraint('fk_prescriptions_hospital_id', 'prescriptions', type_='foreignkey')
    op.drop_column('prescriptions', 'hospital_id')