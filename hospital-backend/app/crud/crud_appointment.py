from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.db.models import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate
from sqlalchemy import select

class CRUDAppointment(CRUDBase[Appointment, AppointmentCreate, AppointmentUpdate]):
    async def get(self, db: AsyncSession, id: int):
        """ Override get to pre-load relationships """
        result = await db.execute(
            select(self.model)
            .options(
                selectinload(self.model.patient), 
                selectinload(self.model.doctor),
                selectinload(self.model.visit)  # <-- EAGER LOAD THE VISIT
            )
            .filter(self.model.id == id)
        )
        return result.scalars().first()

appointment = CRUDAppointment(Appointment)