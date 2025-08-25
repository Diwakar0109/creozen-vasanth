from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Patient(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False, index=True)
    phone_number = Column(String, nullable=False, index=True)
    
    # Optional demographics
    date_of_birth = Column(Date, nullable=True)
    sex = Column(String, nullable=True)
    
    # --- NEW: Link each patient to a hospital ---
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    hospital = relationship("Hospital", back_populates="patients")
    
    # Relationships
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="patient")
    # --- ADD THIS AT THE BOTTOM OF THE CLASS ---
    # This tells the database that the combination of phone_number and hospital_id
    # must be unique. A single phone number can now exist in multiple hospitals.
    __table_args__ = (
        UniqueConstraint('phone_number', 'hospital_id', name='_phone_hospital_uc'),
    )
