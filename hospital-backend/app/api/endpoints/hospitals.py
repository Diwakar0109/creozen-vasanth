from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas, db
from app.api import deps
from app.db import models

router = APIRouter()

# --- ADD THIS NEW SCHEMA in `app/schemas/__init__.py` or a new `hospital.py` schema file ---
# We need a new schema for the payload
class HospitalWithAdminCreate(schemas.HospitalCreate):
    admin_email: str
    admin_full_name: str
    admin_password: str


# In app/api/endpoints/hospitals.py

# --- Make sure these are imported at the top of the file ---
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# ... other imports ...

# --- REPLACE THE ENTIRE FUNCTION WITH THIS ---
@router.post(
    "/", 
    response_model=schemas.Hospital,
    dependencies=[Depends(deps.require_role([models.UserRole.SUPER_ADMIN]))]
)
async def create_hospital_and_admin(
    *,
    db: AsyncSession = Depends(deps.get_db),
    hospital_in: HospitalWithAdminCreate,
):
    """
    (Super Admin Only) Create a new Hospital and its initial Admin user.
    This function now uses the 're-query' pattern for a robust response.
    """
    # 1. Validation Checks
    existing_hospital = await crud.hospital.get_by_name(db, name=hospital_in.name)
    if existing_hospital:
        raise HTTPException(status_code=400, detail="A hospital with this name already exists.")

    existing_user = await crud.user.get_by_email(db, email=hospital_in.admin_email)
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    # 2. Create the ORM objects in memory. We will manage the transaction here.
    new_hospital = models.Hospital(name=hospital_in.name)
    
    from app.core.security import get_password_hash # Local import to avoid circular dependency issues
    new_admin = models.User(
        email=hospital_in.admin_email,
        hashed_password=get_password_hash(hospital_in.admin_password),
        full_name=hospital_in.admin_full_name,
        role=models.UserRole.ADMIN,
        hospital=new_hospital  # Directly link the objects
    )

    # 3. Add both objects to the session and commit them in a single transaction.
    db.add(new_hospital)
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_hospital)

    # 4. The "Re-Query" Pattern:
    # The `new_hospital` object in memory is now 'stale'. We fetch a fresh
    # copy from the DB, explicitly loading the relationships needed for the response.
    hospital_id = new_hospital.id # The ID is populated after the commit
    
    query = (
        select(models.Hospital)
        .options(
            selectinload(models.Hospital.users),
            selectinload(models.Hospital.patients)
        )
        .filter(models.Hospital.id == hospital_id)
    )
    
    result = await db.execute(query)
    created_hospital_for_response = result.scalars().first()
    
    return created_hospital_for_response


@router.get("/", response_model=List[schemas.Hospital], dependencies=[Depends(deps.require_role([models.UserRole.ADMIN, models.UserRole.SUPER_ADMIN]))])
async def read_hospitals(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """ Get a list of all hospitals. Admin or Super Admin only. """
    hospitals = await crud.hospital.get_multi(db, skip=skip, limit=limit)
    return hospitals

@router.put("/{id}", response_model=schemas.Hospital, dependencies=[Depends(deps.require_role([models.UserRole.ADMIN]))])
async def update_hospital(
    id: int,
    hospital_in: schemas.HospitalUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """ Update hospital details. Admin can only update their own hospital. """
    hospital = await crud.hospital.get(db, id=id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    if current_user.hospital_id != id:
        raise HTTPException(status_code=403, detail="Not authorized to update this hospital.")

    hospital = await crud.hospital.update(db, db_obj=hospital, obj_in=hospital_in)
    return hospital




# In app/api/endpoints/hospitals.py

# ... (keep all your other imports and endpoints)

# --- ADD THIS NEW ENDPOINT ---
@router.delete(
    "/{id}",
    response_model=schemas.Msg,
    dependencies=[Depends(deps.require_role([models.UserRole.SUPER_ADMIN]))]
)
async def delete_hospital(
    id: int,
    db: AsyncSession = Depends(deps.get_db),
):
    """
    (Super Admin Only) Delete a hospital and all its associated data.
    NOTE: This is a destructive, cascading operation.
    """
    hospital = await crud.hospital.get(db, id=id)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    # The cascading delete will be handled by the database based on our model relationships.
    # When the hospital is deleted, all users, patients, appointments, etc.,
    # linked to it via foreign keys with cascade rules should also be deleted.
    await crud.hospital.remove(db, id=id)
    
    return schemas.Msg(msg=f"Hospital '{hospital.name}' and all its data have been deleted.")