from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.db.models import Patient
from app.schemas.patient import PatientCreate, PatientUpdate

class CRUDPatient(CRUDBase[Patient, PatientCreate, PatientUpdate]):
    async def get_by_phone(self, db: AsyncSession, *, phone_number: str) -> List[Patient]:
        result = await db.execute(
            select(self.model).filter(self.model.phone_number == phone_number)
        )
        return result.scalars().all()

patient = CRUDPatient(Patient)