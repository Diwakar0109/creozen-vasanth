import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as PyEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_CONSULTATION = "In-Consultation"
    COMPLETED = "Completed"
    NO_SHOW = "No-Show"
    CANCELLED = "Cancelled"

class Appointment(Base):
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    appointment_time = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(PyEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False)
    visit_purpose = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="doctor_appointments")
    created_by = relationship("User", foreign_keys=[created_by_id])
    visit = relationship("Visit", back_populates="appointment", uselist=False, cascade="all, delete-orphan")