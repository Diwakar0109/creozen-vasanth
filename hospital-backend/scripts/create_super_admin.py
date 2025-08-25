# scripts/create_super_admin.py
import asyncio
import sys # <-- ADD THIS
import os # <-- ADD THIS

# --- THIS IS THE FIX ---
# Add the project root directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.models.user import User, UserRole
from app.core.security import get_password_hash

# IMPORTANT: Use the SYNC database URL for this script
engine = create_engine(settings.SYNC_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def create_super_admin():
    print("--- Creating Super Admin ---")

    email = "superuser@creozen.com"
    password = "creozen"
    full_name = "CREOZEN"

    db = SessionLocal()
    try:
        # Check if the user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User with email {email} already exists. Aborting.")
            return

        hashed_password = get_password_hash(password)
        super_admin = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            hospital_id=None # Super admin is not tied to any hospital
        )
        db.add(super_admin)
        db.commit()
        print(f"Super Admin '{full_name}' created successfully with email '{email}'.")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_super_admin())

