import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum,
    ForeignKey,
    func
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


# Define the Enums for database status values
class PrescriptionStatus(str, enum.Enum):
    CREATED = "Created"
    PARTIALLY_DISPENSED = "Partially Dispensed"
    FULLY_DISPENSED = "Fully Dispensed"
    NOT_AVAILABLE = "Not Available"


class DispenseLineStatus(str, enum.Enum):
    GIVEN = "Given"
    PARTIALLY_GIVEN = "Partially Given"
    NOT_GIVEN = "Not Given"
    SUBSTITUTED = "Substituted"


# Define the parent Prescription table
class Prescription(Base):
    __tablename__ = 'prescriptions'

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(PrescriptionStatus), default=PrescriptionStatus.CREATED, nullable=False)

    visit_id = Column(Integer, ForeignKey("visits.id"))
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))

    # --- NEW COLUMN ---
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    line_items = relationship(
        "PrescriptionLineItem",
        back_populates="prescription",
        cascade="all, delete-orphan"
    )

    patient = relationship("Patient", back_populates="prescriptions")
    visit = relationship("Visit", back_populates="prescription")
    doctor = relationship("User")
    hospital = relationship("Hospital", back_populates="prescriptions")  # <--- add relationship


# Define the child PrescriptionLineItem table
class PrescriptionLineItem(Base):
    __tablename__ = 'prescriptionlineitems'

    id = Column(Integer, primary_key=True, index=True)

    medicine_name = Column(String, nullable=False)
    dose = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    duration_days = Column(Integer, nullable=True)
    instructions = Column(String, nullable=True)
    status = Column(Enum(DispenseLineStatus), default=DispenseLineStatus.NOT_GIVEN, nullable=False)
    substitution_info = Column(String, nullable=True)

    prescription_id = Column(Integer, ForeignKey("prescriptions.id"))

    prescription = relationship("Prescription", back_populates="line_items")
