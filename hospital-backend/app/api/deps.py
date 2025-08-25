from typing import AsyncGenerator, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security, config
from app.db import models
from app.db.session import AsyncSessionLocal
from app.schemas import token as token_schema
from app.crud import crud_user

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"/api/login/access-token")

async def get_db() -> AsyncGenerator:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    db: AsyncSession = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> models.User:
    try:
        payload = jwt.decode(
            token, config.settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = token_schema.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = await crud_user.user.get_by_email(db, email=token_data.sub)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_role(required_roles: List[models.user.UserRole]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have the required privileges"
            )
        return current_user
    return role_checker


# ... other imports
from app import crud, schemas

# ...

# --- ADD THIS FUNCTION ---
async def log_action(
    action: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    entity: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[dict] = None,
):
    """ A dependency to log an audit trail entry. """
    log_entry = schemas.AuditLogCreate(
        user_id=current_user.id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details or {}
    )
    await crud.audit_log.create(db, obj_in=log_entry)

# You can then use this in endpoints. For example, in appointments.py:
#
# @router.put("/{id}/status/cancel", ...,
#     dependencies=[Depends(log_action("APPOINTMENT_CANCEL"))] # This is a bit tricky with params
# )
# A more explicit way is to call it inside the endpoint.