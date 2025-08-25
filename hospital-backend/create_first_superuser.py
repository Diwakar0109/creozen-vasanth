# create_first_superuser.py
import asyncio
from app.db.session import AsyncSessionLocal
from app.crud import crud_user
from app.schemas import UserCreate
from app.db.models.user import UserRole

# --- CONFIGURE YOUR FIRST ADMIN USER HERE ---
ADMIN_EMAIL = "admin@hospital.com"
ADMIN_PASSWORD = "supersecretpassword"
ADMIN_FULL_NAME = "Admin User"
# --------------------------------------------

async def main():
    print("Creating initial superuser...")
    db = AsyncSessionLocal()
    user = await crud_user.user.get_by_email(db, email=ADMIN_EMAIL)
    if not user:
        user_in = UserCreate(
            email=ADMIN_EMAIL,
            password=ADMIN_PASSWORD,
            full_name=ADMIN_FULL_NAME,
            role=UserRole.ADMIN
        )
        user = await crud_user.user.create(db, obj_in=user_in)
        print("Superuser created successfully!")
    else:
        print("Superuser already exists.")
    await db.close()

if __name__ == "__main__":
    asyncio.run(main())