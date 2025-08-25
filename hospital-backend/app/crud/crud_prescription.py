from app.crud.base import CRUDBase
from app.db.models import Prescription, PrescriptionLineItem
from app.schemas.prescription import PrescriptionCreate # Note: using custom schema for create

class CRUDPrescription(CRUDBase[Prescription, PrescriptionCreate, None]):
    # Creation is custom because it involves line items, handled in API logic
    pass

prescription = CRUDPrescription(Prescription)