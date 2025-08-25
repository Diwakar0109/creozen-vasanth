from pydantic import BaseModel
from typing import Optional, Dict, Any

class HospitalBase(BaseModel):
    name: str
    settings: Optional[Dict[str, Any]] = None

class HospitalCreate(HospitalBase):
    pass

class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class Hospital(HospitalBase):
    id: int

    class Config:
        from_attributes = True

class HospitalWithAdminCreate(HospitalCreate):
    admin_full_name: str
    admin_email: str
    admin_password: str