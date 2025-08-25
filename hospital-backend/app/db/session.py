from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event, text
from app.core.config import settings
# Do NOT import UserRole here anymore

# Define the engine first
engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Define the listener function separately
def sync_enums(conn, connection_record):
    """
    (Nuclear Option) This function uses a hardcoded list of enums and raw SQL 
    to force the database enum type to be correct, bypassing all Python import issues.
    """
    # --- THIS IS THE FIX ---
    # Hardcode the full, correct list of enum string values.
    # This removes any dependency on the UserRole enum import.
    expected_enums = [
        "super_admin",
        "admin",
        "doctor",
        "nurse",
        "medical_shop"
    ]
    
    # Get the raw database cursor
    cursor = conn.cursor()
    try:
        # Query the database to see which values it *already* has for this enum type
        cursor.execute("SELECT unnest(enum_range(NULL::userrole))::text")
        db_enums = {row[0] for row in cursor.fetchall()}

        # Compare the hardcoded Python values with the database values
        for enum_value in expected_enums:
            if enum_value not in db_enums:
                # If a value is missing in the database, add it with raw SQL.
                cursor.execute(f"ALTER TYPE userrole ADD VALUE '{enum_value}'")
                print(f"Added missing enum value '{enum_value}' to database type 'userrole'.")

    finally:
        cursor.close()

# Now, attach the listener to the synchronous part of the engine
event.listen(engine.sync_engine, "connect", sync_enums)

# Finally, create the sessionmaker
AsyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)