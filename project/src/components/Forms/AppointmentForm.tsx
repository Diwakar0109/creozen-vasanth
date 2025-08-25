import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react'; // Renamed to avoid conflict
import { Patient, User as DoctorUser } from '../../types';
import PatientSearchModal from '../common/PatientSearchModal';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';
import { useAuth } from '../../contexts/AuthContext'; // <-- Import useAuth

interface AppointmentFormProps {
  onSubmit: (appointment: any) => void;
  onCancel: () => void;
  patient?: Patient | null;
  defaultDoctorId?: number | null;
}

export default function AppointmentForm({ onSubmit, onCancel, patient = null, defaultDoctorId = null }: AppointmentFormProps) {
  const { user } = useAuth(); // <-- Get the logged-in user
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patient);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  
  const [formData, setFormData] = useState({
    doctor_id: defaultDoctorId ? String(defaultDoctorId) : '',
    appointment_time: '',
    visit_purpose: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // --- THIS IS THE FIX ---
    // If it's a doctor booking for themselves (defaultDoctorId is present)
    if (defaultDoctorId && user) {
      // Use the user object from context. No API call needed.
      setDoctors([user]);
    } else {
      // Otherwise (it's a Nurse), fetch all doctors
      const fetchDoctors = async () => {
          try {
              const response = await apiClient.get<DoctorUser[]>('/api/users', { params: { role: 'doctor' }});
              setDoctors(response.data);
          } catch (error) {
              toast.error("Failed to load list of doctors.");
          }
      }
      fetchDoctors();
    }
  }, [defaultDoctorId, user]); // Depend on user from context
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        patient_id: selectedPatient.id,
        doctor_id: parseInt(formData.doctor_id),
        appointment_time: new Date(formData.appointment_time).toISOString(),
        visit_purpose: formData.visit_purpose,
      };
      const response = await apiClient.post('/api/appointments/', payload);
      onSubmit(response.data);
    } catch(error: any) {
        toast.error(error.response?.data?.detail || "Failed to create appointment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <p className="font-medium text-gray-900">{selectedPatient.full_name}</p>
              {!patient && (
                <button type="button" onClick={() => setShowPatientModal(true)} className="text-blue-600 text-sm font-medium">Change</button>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setShowPatientModal(true)} className="w-full p-4 border-2 border-dashed rounded-lg flex justify-center items-center">
              <UserIcon className="h-5 w-5 mr-2" /> Select Patient
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
          <select
            required
            value={formData.doctor_id}
            onChange={(e) => setFormData(prev => ({ ...prev, doctor_id: e.target.value }))}
            disabled={!!defaultDoctorId}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
          >
            <option value="">Select a doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>{doctor.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
           <input
            type="datetime-local" required value={formData.appointment_time}
            onChange={e => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visit Purpose (optional)</label>
          <textarea
            value={formData.visit_purpose} onChange={(e) => setFormData(prev => ({ ...prev, visit_purpose: e.target.value }))}
            rows={3} className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg font-medium">Cancel</button>
          <button type="submit" disabled={isLoading || !selectedPatient} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50">
            {isLoading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
      {!patient && (
        <PatientSearchModal isOpen={showPatientModal} onClose={() => setShowPatientModal(false)} onSelectPatient={setSelectedPatient} />
      )}
    </>
  );
}