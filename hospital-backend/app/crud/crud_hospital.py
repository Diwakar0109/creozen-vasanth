from app.crud.base import CRUDBase
from app.db.models.hospital import Hospital
from app.schemas.hospital import HospitalCreate, HospitalUpdate
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

class CRUDHospital(CRUDBase[Hospital, HospitalCreate, HospitalUpdate]):
    pass

hospital = CRUDHospital(Hospital)

class CRUDHospital(CRUDBase[Hospital, HospitalCreate, HospitalUpdate]):
    # --- ADD THIS NEW METHOD ---
    async def get_by_name(self, db: AsyncSession, *, name: str) -> Optional[Hospital]:
        result = await db.execute(select(self.model).filter(self.model.name == name))
        return result.scalars().first()

hospital = CRUDHospital(Hospital)