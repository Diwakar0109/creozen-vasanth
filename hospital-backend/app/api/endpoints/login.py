# In app/api/endpoints/login.py

from datetime import timedelta, datetime # <-- Add datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login/access-token", response_model=schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await crud.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # We add the user's role to the token so the frontend can use it
    # without an extra API call. The `user.role` is now correctly read
    # from the database as a UserRole enum object.
    additional_claims = {"role": user.role.value} # Use .value to get the string "super_admin"
    
    access_token = security.create_access_token(
        subject=user.email, expires_delta=access_token_expires, additional_claims=additional_claims
    )
    
    # Update last login time
    user.last_login = datetime.utcnow()
    await db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }