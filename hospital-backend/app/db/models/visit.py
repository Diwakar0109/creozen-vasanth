from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from pydantic import BaseModel
from typing import List


class Visit(Base):
    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True)
    
    # SOAP Notes (visible to other doctors/admins)
    diagnosis_summary = Column(String, nullable=True) # Shareable summary
    subjective = Column(Text, nullable=True)
    objective = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    
    # Relationships
    appointment = relationship("Appointment", back_populates="visit")
    notes = relationship("ClinicalNote", back_populates="visit", cascade="all, delete-orphan")
    prescription = relationship("Prescription", back_populates="visit", uselist=False)

class ClinicalNote(Base):
    """ Doctor's private notes. The core privacy rule is enforced here. """
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    author_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # Relationships
    visit = relationship("Visit", back_populates="notes")
    author_doctor = relationship("User", back_populates="authored_notes")

