from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogCreate(BaseModel):
    user_id: Optional[int]
    action: str
    entity: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None

class AuditLog(AuditLogCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True