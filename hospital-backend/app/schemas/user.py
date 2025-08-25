# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
# --- THIS IS A CRITICAL FIX ---
# Import the enum from the single source of truth: the DB model.
from app.db.models.user import UserRole

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole # Use the imported enum
    hospital_id: Optional[int] = None

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    role: UserRole # Use the imported enum
    hospital_id: Optional[int] = None

    class Config:
        from_attributes = True

class TokenPayload(BaseModel):
    # ...
    role: Optional[UserRole] = None # Must use the imported type