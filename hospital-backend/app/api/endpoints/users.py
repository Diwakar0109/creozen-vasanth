from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app import schemas, crud
from app.api import deps
from app.db import models
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/me", response_model=schemas.User)
async def read_user_me(
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get(
    "/",
    response_model=List[schemas.User],
    dependencies=[Depends(deps.require_role([models.UserRole.ADMIN, models.UserRole.NURSE]))]
)
async def read_users(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    role: Optional[models.UserRole] = None,
    is_active: Optional[bool] = None
):
    """
    Get a list of users. Admins/Nurses can ONLY see users from their own hospital.
    """
    if not current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Requesting user is not associated with a hospital.")
    
    query = select(models.User).filter(models.User.hospital_id == current_user.hospital_id)

    if role:
        query = query.filter(models.User.role == role)
    if is_active is not None:
        query = query.filter(models.User.is_active == is_active)
        
    query = query.filter(models.User.id != current_user.id) # Don't show the admin themself in the list
    
    result = await db.execute(query.order_by(models.User.full_name))
    return result.scalars().all()


# --- THIS IS THE MISSING ENDPOINT THAT FIXES YOUR 422 ERROR ---
@router.get(
    "/my-staff",
    response_model=List[schemas.User],
    dependencies=[Depends(deps.require_role([models.UserRole.DOCTOR]))]
)
async def read_my_staff(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
    role_str: str = Query(..., alias="role")
):
    """
    Get a list of users that a Doctor can manage (Nurses, Medical Shops).
    """
    # Manually validate the incoming role string
    try:
        role_enum = models.UserRole(role_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"'{role_str}' is not a valid role."
        )

    if role_enum not in [models.UserRole.NURSE, models.UserRole.MEDICAL_SHOP]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctors can only view Nurses or Medical Shops."
        )
    
    # Securely query for staff in the doctor's own hospital
    query = select(models.User).filter(
        models.User.role == role_enum,
        models.User.hospital_id == current_user.hospital_id
    )
    
    result = await db.execute(query.order_by(models.User.full_name))
    return result.scalars().all()


@router.get("/{id}", response_model=schemas.User)
async def read_user_by_id(
    id: int, 
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Get user by ID.
    - Admins can get any user in their hospital.
    - Other users can only get their own profile.
    """
    user = await crud.user.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security check
    if current_user.role == models.UserRole.ADMIN:
        if user.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Not authorized to access users outside your hospital.")
        return user
    
    if current_user.id == id:
        return current_user

    raise HTTPException(status_code=403, detail="Not authorized to access this user's details")


@router.post(
    "/",
    response_model=schemas.User,
    dependencies=[Depends(deps.require_role([models.UserRole.ADMIN, models.UserRole.DOCTOR]))],
)
async def create_user(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Create new user and assign them to the creator's hospital.
    """
    if current_user.role == models.UserRole.DOCTOR and user_in.role not in [models.UserRole.NURSE, models.UserRole.MEDICAL_SHOP]:
        raise HTTPException(status_code=403, detail="Doctors can only create Nurse or Medical Shop users.")
    if current_user.role == models.UserRole.ADMIN and user_in.role not in [models.UserRole.DOCTOR, models.UserRole.NURSE, models.UserRole.MEDICAL_SHOP]:
        raise HTTPException(status_code=403, detail="Admins can only create Doctor, Nurse, or Medical Shop users.")

    if not current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Creator is not associated with a hospital and cannot create users.")

    # Validation: Check for email uniqueness within the same hospital for clinical staff
    existing_user = await db.scalar(
        select(models.User).filter(
            models.User.email == user_in.email,
            models.User.hospital_id == current_user.hospital_id
        )
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists in this hospital.")

    # Construct the new user object manually to guarantee hospital_id is set
    new_user_db_object = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
        hospital_id=current_user.hospital_id
    )
    
    db.add(new_user_db_object)
    await db.commit()
    await db.refresh(new_user_db_object)
    
    return new_user_db_object


@router.put("/{id}", response_model=schemas.User, dependencies=[Depends(deps.require_role([models.UserRole.ADMIN, models.UserRole.DOCTOR]))])
async def update_user(
    id: int,
    user_in: schemas.UserUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """ Update user details (e.g., activate/deactivate). """
    user = await crud.user.get(db, id=id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Security Check: Can only manage users in your own hospital
    if user.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized to manage users outside your hospital.")

    if current_user.role == models.UserRole.DOCTOR:
        if user.role not in [models.UserRole.NURSE, models.UserRole.MEDICAL_SHOP]:
             raise HTTPException(status_code=403, detail="Doctors can only manage Nurses or Medical Shops.")

    user = await crud.user.update(db, db_obj=user, obj_in=user_in)
    return user


@router.post(
    "/{id}/reset-password", 
    response_model=schemas.Msg, 
    dependencies=[Depends(deps.require_role([models.UserRole.ADMIN, models.UserRole.DOCTOR]))]
)
async def reset_user_password(
    id: int, 
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """ Reset a user's password for users within the same hospital. """
    user_to_reset = await crud.user.get(db, id=id)
    if not user_to_reset:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Security Check
    if user_to_reset.hospital_id != current_user.hospital_id:
        raise HTTPException(status_code=403, detail="Not authorized to manage users outside your hospital.")

    if current_user.role == models.UserRole.DOCTOR:
        if user_to_reset.role not in [models.UserRole.NURSE, models.UserRole.MEDICAL_SHOP]:
            raise HTTPException(status_code=403, detail="Doctors can only reset passwords for Nurses or Medical Shops.")
    
    return {"msg": f"Password reset initiated for user {user_to_reset.email}"}