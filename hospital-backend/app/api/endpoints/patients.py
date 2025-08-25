from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app import schemas, crud
from app.api import deps
from app.db import models

router = APIRouter()


@router.post(
    "/",
    response_model=schemas.Patient,
    dependencies=[Depends(deps.require_role([models.UserRole.NURSE, models.UserRole.DOCTOR]))],
)
async def create_patient(
    *,
    db: AsyncSession = Depends(deps.get_db),
    patient_in: schemas.PatientCreate,
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Register a new patient. The new patient is ALWAYS assigned to the creator's hospital.
    """
    if not current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Creator is not associated with a hospital and cannot create patients.")

    # Validation: Check for duplicate phone number WITHIN THE SAME HOSPITAL
    existing_patient = await db.scalar(
        select(models.Patient).filter(
            models.Patient.phone_number == patient_in.phone_number,
            models.Patient.hospital_id == current_user.hospital_id
        )
    )
    if existing_patient:
         raise HTTPException(
            status_code=400,
            detail="A patient with this phone number already exists in this hospital.",
        )

    # Construct the new patient object manually to guarantee hospital_id is set
    new_patient_db_object = models.Patient(
        **patient_in.dict(), 
        hospital_id=current_user.hospital_id
    )
    
    db.add(new_patient_db_object)
    await db.commit()
    await db.refresh(new_patient_db_object)
    
    return new_patient_db_object


@router.get(
    "/",
    response_model=List[schemas.Patient],
    dependencies=[Depends(deps.require_role([models.UserRole.DOCTOR, models.UserRole.NURSE]))]
)
async def read_all_patients(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    search: Optional[str] = None,
    appointment_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
):
    """
    Get a list of patients with filters, restricted to the user's own hospital.
    """
    # CRITICAL SECURITY FILTER
    query = select(models.Patient).filter(
        models.Patient.hospital_id == current_user.hospital_id
    )

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Patient.full_name.ilike(search_term),
                models.Patient.phone_number.ilike(search_term),
            )
        )

    if appointment_date:
        query = query.join(models.Patient.appointments).filter(
            func.date(models.Appointment.appointment_time) == appointment_date
        ).distinct()

    result = await db.execute(
        query.order_by(models.Patient.full_name).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get(
    "/search",
    response_model=List[schemas.Patient] 
)
async def search_patients_by_phone(
    phone_number: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Searches patients by an exact phone number ONLY within the user's hospital.
    """
    if not current_user.hospital_id:
        raise HTTPException(status_code=403, detail="User is not associated with a hospital.")

    query = select(models.Patient).filter(
        models.Patient.phone_number == phone_number,
        models.Patient.hospital_id == current_user.hospital_id
    )
    
    result = await db.execute(query)
    patients = result.scalars().all() 
    return patients


@router.get("/{id}", response_model=schemas.Patient)
async def read_patient(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Get a single patient's details, ensuring they belong to the user's hospital.
    """
    patient = await crud.patient.get(db=db, id=id)
    if not patient or patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital")
    return patient

# In app/api/endpoints/patients.py

# In app/api/endpoints/patients.py

# ... (keep all your imports)

# --- REPLACE THE ENTIRE `get_patient_visits` FUNCTION WITH THIS NEW ONE ---
@router.get(
    "/{id}/appointment-history", # <-- New, more descriptive URL
    response_model=List[schemas.Appointment], # <-- Now returns a list of Appointments
    dependencies=[Depends(deps.require_role([models.UserRole.DOCTOR, models.UserRole.NURSE]))]
)
async def get_patient_appointment_history(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Get a list of all past APPOINTMENTS for a specific patient, including
    all visit and prescription details for a complete history view.
    """
    # Security check: Ensure the patient belongs to the current user's hospital.
    patient = await db.get(models.Patient, id)
    if not patient or patient.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital.")

    # Query for Appointments, not just Visits.
    query = (
        select(models.Appointment)
        .filter(models.Appointment.patient_id == id)
        # We only want to show completed appointments in the history.
        .filter(models.Appointment.status == models.appointment.AppointmentStatus.COMPLETED)
        .options(
            # Eagerly load all the nested data we need for the UI
            selectinload(models.Appointment.doctor), # Load the doctor for the visit
            selectinload(models.Appointment.visit).options(
                selectinload(models.Visit.prescription).options(
                    selectinload(models.Prescription.line_items),
                    selectinload(models.Prescription.patient)
                ),
                selectinload(models.Visit.notes)
                .selectinload(models.ClinicalNote.author_doctor)
            )
        )
        .order_by(models.Appointment.appointment_time.desc())
    )
    
    result = await db.execute(query)
    return result.scalars().all()