from pydantic import BaseModel
from typing import Optional
from datetime import date

class PatientBase(BaseModel):
    full_name: str
    phone_number: str
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    
    class Config:
        from_attributes  = True

# Schema for the patient-picker dropdown
class PatientLookup(BaseModel):
    id: int
    full_name: str
    phone_number: str
    age: Optional[int]
    sex: Optional[str]
    last_visit_date: Optional[date]

    class Config:
        from_attributes  = True