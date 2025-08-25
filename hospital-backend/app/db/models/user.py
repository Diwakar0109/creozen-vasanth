# app/db/models/user.py

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as PyEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UserRole(str, enum.Enum):
    # This remains our source of truth
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"
    MEDICAL_SHOP = "medical_shop"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # --- THIS IS THE FINAL FORCIBLE FIX ---
    role = Column(
        PyEnum(
            UserRole, 
            name="userrole",         # Explicitly name the DB type
            values_callable=lambda obj: [e.value for e in obj] # Force use of lowercase values
        ),
        nullable=False
    )
    # ------------------------------------
    
    is_active = Column(Boolean, default=True)
    speciality = Column(String, nullable=True) # For doctors
    last_login = Column(DateTime, nullable=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=True)
    hospital = relationship("Hospital", back_populates="users")
    
    doctor_appointments = relationship(
        "Appointment",
        back_populates="doctor",
        foreign_keys="Appointment.doctor_id"
    )
    
    authored_notes = relationship("ClinicalNote", back_populates="author_doctor")