# In app/schemas/__init__.py

# Import all the schema classes and expose them at the top level of the 'schemas' package.
# This makes them easy to access from other parts of the application (e.g., schemas.User, schemas.Visit).

from .user import User, UserCreate, UserUpdate
from .patient import Patient, PatientCreate, PatientUpdate
from .token import Token, TokenPayload
from .msg import Msg
from .hospital import Hospital, HospitalCreate, HospitalUpdate, HospitalWithAdminCreate

# --- THIS IS THE FIX ---
# We replace the old import line with this one, which imports the
# new, standardized classes we created in the last step.
from .visit import Visit, VisitCreate, VisitUpdate, ClinicalNote

# Continue with the other standardized imports
from .prescription import Prescription, PrescriptionCreate, PrescriptionUpdate, DispenseUpdate, PharmacyStats
from .appointment import Appointment, AppointmentCreate, AppointmentUpdate, CompleteVisitPayload