# In app/db/models/hospital.py
from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# ✅ Make sure Prescription is imported so SQLAlchemy can link it
from app.db.models.prescription import Prescription


class Hospital(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    settings = Column(JSON, nullable=True)

    # --- Relationships ---
    users = relationship(
        "User", 
        back_populates="hospital", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    patients = relationship(
        "Patient", 
        back_populates="hospital", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )
    prescriptions = relationship(   # ✅ NEW
        "Prescription", 
        back_populates="hospital", 
        cascade="all, delete-orphan",
        passive_deletes=True
    )
