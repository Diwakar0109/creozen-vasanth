from pydantic import BaseModel
from typing import Optional, List
from .prescription import Prescription
from .user import User as UserSchema

# Sub-schema for clinical notes, used inside the main Visit schema
class ClinicalNote(BaseModel):
    id: int
    content: str
    author_doctor: UserSchema

    class Config:
        from_attributes = True

# Base schema with fields common to creation and response
class VisitBase(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None

class VisitCreate(VisitBase):
    private_note: Optional[str] = None # For creating via the doctor's payload

class VisitUpdate(VisitBase):
    pass

# The main `Visit` schema for all API responses
# This is the single, standard class we will use everywhere.
class Visit(VisitBase):
    id: int
    prescription: Optional[Prescription] = None
    authored_notes: List[ClinicalNote] = []

    class Config:
        from_attributes = True