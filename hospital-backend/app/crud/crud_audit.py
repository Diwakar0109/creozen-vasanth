from app.crud.base import CRUDBase
from app.db.models.audit_log import AuditLog
from app.schemas.audit import AuditLogCreate

class CRUDAuditLog(CRUDBase[AuditLog, AuditLogCreate, None]): # No updates for audit logs
    pass

audit_log = CRUDAuditLog(AuditLog)