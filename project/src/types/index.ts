export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'medical_shop';

// --- ADD THIS NEW INTERFACE ---
export interface Hospital {
  id: number;
  name: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  role: UserRole;
  hospital_id?: number;
}

export interface Patient {
  id: number;
  full_name: string;
  phone_number: string;
  date_of_birth?: string;
  sex?: string;
  hospital_id: number; // Patient is tied to a hospital
}

export type AppointmentStatus = 'Scheduled' | 'In-Consultation' | 'Completed' | 'No-Show' | 'Cancelled';

export type PrescriptionRecordStatus = 'Created' | 'Partially Dispensed' | 'Fully Dispensed' | 'Not Available';

export type DispenseLineStatus = 'Given' | 'Partially Given' | 'Not Given' | 'Substituted';

export interface PrescriptionMedicine {
  id: number;
  medicine_name: string;
  dose?: string;
  frequency?: string;
  duration_days?: number;
  instructions?: string;
  status: DispenseLineStatus;
  substitution_info?: string;
}

export interface ClinicalNote {
  id: number;
  content: string;
  author_doctor: User;
}

export interface PrescriptionRecord {
  id: number;
  status: PrescriptionRecordStatus;
  patient_id: number;
  doctor_id: number;
  visit_id: number;
  line_items: PrescriptionMedicine[];
  patient: Patient;
}

export interface Visit {
  id: number;
  diagnosis_summary?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  prescription?: PrescriptionRecord;
  authored_notes?: ClinicalNote[];
}

export interface Appointment {
  id: number;
  appointment_time: string;
  status: AppointmentStatus;
  visit_purpose?: string;
  patient: Patient;
  doctor: User;
  visit?: Visit;
}