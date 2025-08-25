from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import models
from app.db.models.prescription import PrescriptionStatus, DispenseLineStatus
from app import schemas
from app.api import deps
from app.socket_manager import notify_user

router = APIRouter()

# In app/api/endpoints/prescriptions.py
@router.get(
    "/queue",
    response_model=List[schemas.Prescription],
    dependencies=[Depends(deps.require_role([models.UserRole.MEDICAL_SHOP, models.UserRole.ADMIN]))],
)
async def get_pharmacy_queue(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),  # ✅ need this for hospital_id
):
    """
    Get the queue of new and in-progress prescriptions ONLY for the current user's hospital.
    """
    result = await db.execute(
        select(models.Prescription)
        .options(
            selectinload(models.Prescription.line_items),
            selectinload(models.Prescription.patient),
        )
        # ✅ security filter by hospital_id
        .filter(models.Prescription.hospital_id == current_user.hospital_id)
        .filter(
            models.Prescription.status.in_([
                models.prescription.PrescriptionStatus.CREATED,
                models.prescription.PrescriptionStatus.PARTIALLY_DISPENSED,
            ])
        )
        .order_by(models.Prescription.id.desc())
    )
    return result.scalars().all()


# --- Pharmacy Stats Endpoint ---
@router.get(
    "/stats",
    response_model=schemas.PharmacyStats,
    dependencies=[Depends(deps.require_role([models.UserRole.MEDICAL_SHOP]))],
)
async def get_pharmacy_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),  # ✅ required
):
    """
    Get pharmacy KPIs ONLY for the current user's hospital.
    """
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = today_start + timedelta(days=1)

    # ✅ add hospital_id security filter to base query
    base_query = select(func.count(models.Prescription.id)).filter(
        models.Prescription.hospital_id == current_user.hospital_id
    )

    new_query = base_query.filter(
        models.Prescription.status == models.prescription.PrescriptionStatus.CREATED
    )
    inprogress_query = base_query.filter(
        models.Prescription.status == models.prescription.PrescriptionStatus.PARTIALLY_DISPENSED
    )
    completed_query = base_query.filter(
        models.Prescription.status == models.prescription.PrescriptionStatus.FULLY_DISPENSED,
        models.Prescription.created_at >= today_start,
        models.Prescription.created_at < today_end,
    )

    # Execute queries in parallel
    new_res, inprogress_res, completed_res = await asyncio.gather(
        db.scalar(new_query),
        db.scalar(inprogress_query),
        db.scalar(completed_query),
    )

    return schemas.PharmacyStats(
        new_prescriptions=new_res or 0,
        in_progress=inprogress_res or 0,
        completed_today=completed_res or 0,
        total_pending=(new_res or 0) + (inprogress_res or 0),
    )


@router.put(
    "/{id}/dispense",
    response_model=schemas.Prescription,
    dependencies=[Depends(deps.require_role([models.UserRole.MEDICAL_SHOP]))],
)
async def dispense_prescription(
    id: int,
    updates: List[schemas.DispenseUpdate],
    db: AsyncSession = Depends(deps.get_db),
    # Added current_user to send notifications
    current_user: models.User = Depends(deps.get_current_user), 
):
    """
    Pharmacy marks prescription line items as given, substituted, etc.
    """
    # --- THE FIX IS HERE ---
    # We must explicitly load ALL relationships that the response_model needs.
    query = (
        select(models.Prescription)
        .options(
            selectinload(models.Prescription.line_items),
            selectinload(models.Prescription.patient) # Eager load the patient
        )
        .filter(models.Prescription.id == id)
    )
    result = await db.execute(query)
    prescription = result.scalars().first()
    # -----------------------

    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    line_item_map = {item.id: item for item in prescription.line_items}
    
    for update in updates:
        if update.line_item_id in line_item_map:
            line_item = line_item_map[update.line_item_id]
            line_item.status = update.status
            line_item.substitution_info = update.substitution_info
    
    # Logic to determine the overall prescription status
    all_statuses = {item.status for item in prescription.line_items}
    if all(s in [models.prescription.DispenseLineStatus.GIVEN, models.prescription.DispenseLineStatus.SUBSTITUTED] for s in all_statuses):
        prescription.status = models.prescription.PrescriptionStatus.FULLY_DISPENSED
    elif any(s != models.prescription.DispenseLineStatus.NOT_GIVEN for s in all_statuses):
        prescription.status = models.prescription.PrescriptionStatus.PARTIALLY_DISPENSED
    # Optional: logic for 'Not Available' status if all are 'Not Given'
    
    await db.commit()
    await db.refresh(prescription) # Refresh to get latest DB state after commit

    # Ensure relationships are loaded on the refreshed object for the final return
    # This can sometimes be necessary after a refresh
    await db.refresh(prescription, attribute_names=['patient', 'line_items'])


    await notify_user(
        prescription.doctor_id,
        "dispense_update",
        {"prescription_id": prescription.id, "status": prescription.status.value},
    )

    return prescription



# Get single prescription
@router.get("/{id}", response_model=schemas.Prescription)
async def read_prescription(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),  # keep only if you’ll enforce access rules
):
    """Get a single prescription by ID."""
    query = (
        select(models.Prescription)
        .filter(models.Prescription.id == id)
        .options(
            selectinload(models.Prescription.line_items),
            selectinload(models.Prescription.patient),
        )
    )
    result = await db.execute(query)
    prescription = result.scalars().first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    return prescription


# In app/api/endpoints/prescriptions.py
# Make sure to import these at the top of the file
import asyncio
from datetime import date, datetime, timedelta
from sqlalchemy import func

# ... (keep all your existing endpoints) ...
