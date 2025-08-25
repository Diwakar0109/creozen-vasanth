from pydantic import BaseModel
from typing import Optional, List
from .patient import Patient
from ..db.models.prescription import PrescriptionStatus, DispenseLineStatus

# --- Sub-Schemas for Prescription Line Items ---

class PrescriptionLineItemBase(BaseModel):
    medicine_name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    duration_days: Optional[int] = None
    instructions: Optional[str] = None

class PrescriptionLineItemCreate(PrescriptionLineItemBase):
    pass

class PrescriptionLineItem(PrescriptionLineItemBase):
    id: int
    status: DispenseLineStatus

    class Config:
        from_attributes = True

# --- Main Prescription Schemas ---

class PrescriptionBase(BaseModel):
    pass

class PrescriptionCreate(PrescriptionBase):
    line_items: List[PrescriptionLineItemCreate] = []

# --- THIS IS THE MISSING CLASS ---
# A schema for updating a prescription. For now, it's empty as we don't
# have specific update logic, but it's required for the import to work.
class PrescriptionUpdate(PrescriptionBase):
    pass

# The main response schema for a Prescription
class Prescription(PrescriptionBase):
    id: int
    status: PrescriptionStatus
    patient: Patient
    line_items: List[PrescriptionLineItem] = []

    class Config:
        from_attributes = True

# --- Other Schemas Used by Pharmacy Endpoints ---

class DispenseUpdate(BaseModel):
    line_item_id: int
    status: DispenseLineStatus
    substitution_info: Optional[str] = None

class PharmacyStats(BaseModel):
    new_prescriptions: int
    in_progress: int
    completed_today: int
    total_pending: int