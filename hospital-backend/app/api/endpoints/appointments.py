from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
# --- ADD THE MISSING IMPORT ON THE LINE BELOW ---
from datetime import date 
from app.socket_manager import notify_user, notify_pharmacy

from app import schemas, crud, db
from app.db import models
from app.api import deps
from app.db.models.prescription import PrescriptionStatus, DispenseLineStatus


router = APIRouter()


@router.post(
    "/",
    response_model=schemas.Appointment,
    dependencies=[Depends(deps.require_role([models.UserRole.NURSE, models.UserRole.DOCTOR]))],
)
async def create_appointment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    appointment_in: schemas.AppointmentCreate,
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Create a new appointment (Nurse or Doctor).
    """
    appointment_data = appointment_in.dict()
    appointment_data['created_by_id'] = current_user.id
    db_obj = models.Appointment(**appointment_data)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    await db.refresh(db_obj, attribute_names=['patient', 'doctor', 'visit'])
    
    appointment = db_obj 

    await notify_user(
        appointment.doctor_id,
        "new_appointment",
        {"appointment_id": appointment.id, "patient_name": appointment.patient.full_name},
    )
    return appointment

# In app/api/endpoints/appointments.py

# Make sure these are all imported at the top of the file
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from datetime import date

# ... (rest of your imports)


@router.get("/", response_model=List[schemas.Appointment])
async def read_appointments(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    patient_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    appointment_date: Optional[date] = None,
):
    """
    Get list of appointments with filters.
    - Eager loads all necessary nested data for the dashboard and consultation modal.
    """
    # --- THIS QUERY IS THE FINAL AND COMPLETE FIX ---
    # It now loads all the nested relationships required by the frontend modal,
    # including the private clinical notes.
    query = select(models.Appointment).options(
        selectinload(models.Appointment.patient),
        selectinload(models.Appointment.doctor),
        
        # Chain to load visit and all its children
        selectinload(models.Appointment.visit).options(
            # Load the prescription and its line items from the visit
            selectinload(models.Visit.prescription).selectinload(models.Prescription.line_items),
            # ALSO load the private notes and their author from the visit
            selectinload(models.Visit.notes).selectinload(models.ClinicalNote.author_doctor)
        )
    )
    if current_user.role != models.UserRole.SUPER_ADMIN:
        query = query.join(models.Appointment.doctor).filter(models.User.hospital_id == current_user.hospital_id)
    # Apply filters
    if current_user.role == models.UserRole.DOCTOR and not doctor_id:
        query = query.filter(models.Appointment.doctor_id == current_user.id)
    elif doctor_id:
        query = query.filter(models.Appointment.doctor_id == doctor_id)
        
    if patient_id:
        query = query.filter(models.Appointment.patient_id == patient_id)
    
    if appointment_date:
        query = query.filter(func.date(models.Appointment.appointment_time) == appointment_date)
    
    result = await db.execute(query.order_by(models.Appointment.appointment_time))
    return result.scalars().all()

async def update_appointment_status(
    id: int, 
    status: models.appointment.AppointmentStatus,
    db: AsyncSession,
    current_user: models.User
) -> models.Appointment:
    appointment = await crud.appointment.get(db=db, id=id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if not (current_user.role in [models.UserRole.NURSE, models.UserRole.ADMIN] or appointment.doctor_id == current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this appointment")
    
    appointment.status = status
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.put("/{id}/status/cancel", response_model=schemas.Appointment)
async def cancel_appointment(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.require_role([models.UserRole.DOCTOR, models.UserRole.NURSE])),
):
    appointment = await update_appointment_status(id, models.appointment.AppointmentStatus.CANCELLED, db, current_user)
    
    log_entry = schemas.AuditLogCreate(
        user_id=current_user.id, 
        action="APPOINTMENT_CANCELLED", 
        entity="Appointment", 
        entity_id=id
    )
    await crud.audit_log.create(db, obj_in=log_entry)
    
    return appointment


@router.put("/{id}/status/no-show", response_model=schemas.Appointment)
async def mark_appointment_no_show(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.require_role([models.UserRole.DOCTOR, models.UserRole.NURSE])),
):
    """ Mark an appointment as a no-show. """
    return await update_appointment_status(id, models.appointment.AppointmentStatus.NO_SHOW, db, current_user)


@router.put("/{id}/status/start", response_model=schemas.Appointment)
async def start_consultation(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.require_role([models.UserRole.DOCTOR])),
):
    """
    Doctor starts the consultation, creating a new Visit record.
    Returns the fully-loaded Appointment object.
    """
    initial_result = await db.execute(
        select(models.Appointment)
        .options(selectinload(models.Appointment.visit))
        .filter(models.Appointment.id == id)
    )
    appointment = initial_result.scalars().first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this appointment")
    if appointment.visit:
        raise HTTPException(status_code=400, detail="Consultation has already been started.")

    appointment.status = models.appointment.AppointmentStatus.IN_CONSULTATION
    new_visit = models.Visit()
    appointment.visit = new_visit
    db.add(appointment)
    await db.commit() 

    final_result = await db.execute(
        select(models.Appointment)
        .filter(models.Appointment.id == id)
        .options(
            selectinload(models.Appointment.patient),
            selectinload(models.Appointment.doctor),
            selectinload(models.Appointment.visit)
            .selectinload(models.Visit.prescription)
            .selectinload(models.Prescription.line_items)
        )
    )
    
    updated_appointment = final_result.scalars().first()
    return updated_appointment

@router.put(
    "/{id}/status/complete", 
    response_model=schemas.Msg,
)
async def save_visit_details(
    id: int,
    payload: schemas.CompleteVisitPayload,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.require_role([models.UserRole.DOCTOR])),
):
    """
    Doctor saves or updates visit details (notes, prescription).
    This endpoint is now idempotent and respects prescription status.
    """
    result = await db.execute(
        select(models.Appointment)
        .options(
            selectinload(models.Appointment.patient), 
            selectinload(models.Appointment.visit)
            .selectinload(models.Visit.prescription)
            .selectinload(models.Prescription.line_items)
        )
        .filter(models.Appointment.id == id)
    )
    appointment = result.scalars().first()
    
    if not appointment or not appointment.visit:
        raise HTTPException(
            status_code=404, 
            detail="Consultation not found or was not properly started."
        )
    if appointment.doctor_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to complete this visit."
        )

    visit = appointment.visit
    existing_prescription = visit.prescription

    if existing_prescription and existing_prescription.status == PrescriptionStatus.FULLY_DISPENSED:
        raise HTTPException(
            status_code=403, 
            detail="Cannot edit a visit with a fully dispensed prescription."
        )

    # mark appointment complete
    appointment.status = models.appointment.AppointmentStatus.COMPLETED

    # update visit details
    visit_data = payload.visit_details.dict(exclude_unset=True)
    private_note_content = visit_data.pop("private_note", None)
    for key, value in visit_data.items():
        setattr(visit, key, value)

    # handle prescription logic
    if payload.prescription_details and payload.prescription_details.line_items:
        if not existing_prescription:
            # --- CREATE PRESCRIPTION ---
            new_prescription = models.Prescription(
                visit_id=visit.id,
                patient_id=appointment.patient_id,
                doctor_id=current_user.id,
                hospital_id=current_user.hospital_id,   # ✅ FIX
            )
            for item in payload.prescription_details.line_items:
                new_prescription.line_items.append(
                    models.PrescriptionLineItem(**item.dict())
                )
            db.add(new_prescription)
            await db.flush()  # ✅ ensure new_prescription.id is generated

            await notify_pharmacy(
                "new_prescription",
                {
                    "prescription_id": new_prescription.id,
                    "patient_name": appointment.patient.full_name,
                },
            )
        else:
            # --- UPDATE PRESCRIPTION ---
            dispensed_items = [
                item for item in existing_prescription.line_items 
                if item.status != DispenseLineStatus.NOT_GIVEN
            ]
            new_items_from_payload = [
                models.PrescriptionLineItem(**item.dict()) 
                for item in payload.prescription_details.line_items
            ]
            existing_prescription.line_items = dispensed_items + new_items_from_payload
    else:
        if existing_prescription:
            # keep only dispensed items if no new line items are provided
            existing_prescription.line_items = [
                item for item in existing_prescription.line_items 
                if item.status != DispenseLineStatus.NOT_GIVEN
            ]

    await db.commit()
    
    return schemas.Msg(msg="Visit details saved successfully.")
# In app/api/endpoints/appointments.py

# ... (keep all your existing imports and endpoints)

# --- ADD THIS ENTIRE NEW ENDPOINT ---
@router.get(
    "/all",
    response_model=List[schemas.Appointment],
    dependencies=[Depends(deps.require_role([models.UserRole.NURSE]))]
)
async def read_all_appointments_for_nurses(
    db: AsyncSession = Depends(deps.get_db),
    appointment_date: Optional[date] = None,
    doctor_id: Optional[int] = None,
    patient_gender: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_user) 
):
    """
    (Nurses Only) Get a comprehensive list of all appointments with powerful filters.
    - Eager loads all consultation details for a read-only view.
    """
    query = select(models.Appointment).options(
        selectinload(models.Appointment.patient),
        selectinload(models.Appointment.doctor),
        selectinload(models.Appointment.visit).options(
            selectinload(models.Visit.prescription).selectinload(models.Prescription.line_items),
            selectinload(models.Visit.notes).selectinload(models.ClinicalNote.author_doctor)
        )
    ).join(models.Appointment.patient) # Join patient to filter on gender
    query = query.join(models.Appointment.doctor).filter(models.User.hospital_id == current_user.hospital_id)
    # Apply filters
    if appointment_date:
        query = query.filter(func.date(models.Appointment.appointment_time) == appointment_date)
    
    if doctor_id:
        query = query.filter(models.Appointment.doctor_id == doctor_id)
        
    if patient_gender:
        query = query.filter(models.Patient.sex == patient_gender)
    
    result = await db.execute(query.order_by(models.Appointment.appointment_time.desc()))
    return result.scalars().all()