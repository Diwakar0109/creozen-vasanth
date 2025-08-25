# In app/schemas/token.py

from pydantic import BaseModel, EmailStr
from typing import Optional
# --- THIS IS THE FIX ---
# Import the single source of truth for the UserRole enum
from app.db.models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[EmailStr] = None
    # This ensures the schema validation uses the most up-to-date enum
    role: Optional[UserRole] = None 