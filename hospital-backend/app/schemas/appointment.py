from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Import other necessary schemas
from .patient import Patient
from .user import User
from .prescription import PrescriptionCreate
# --- THIS IS THE FIX ---
# Import the new, standardized `Visit` and `VisitCreate` schemas
from .visit import Visit, VisitCreate

# Base schema with common fields
class AppointmentBase(BaseModel):
    appointment_time: datetime
    visit_purpose: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    patient_id: int
    doctor_id: int

class AppointmentUpdate(AppointmentBase):
    pass

# The main response schema for appointments
class Appointment(AppointmentBase):
    id: int
    status: str
    patient: Patient
    doctor: User
    
    # --- THIS IS THE FIX ---
    # It now correctly references the standard `Visit` schema
    visit: Optional[Visit] = None

    class Config:
        from_attributes = True

# Schema for the "complete visit" payload
class CompleteVisitPayload(BaseModel):
    visit_details: VisitCreate
    prescription_details: Optional[PrescriptionCreate] = None