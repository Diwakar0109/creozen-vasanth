from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "auditlogs" # Override automatic pluralization

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # User who performed the action
    action = Column(String, nullable=False) # e.g., "USER_UPDATE", "APPOINTMENT_CANCELLED"
    entity = Column(String, nullable=True) # e.g., "User", "Appointment"
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True) # Store before/after state or other context