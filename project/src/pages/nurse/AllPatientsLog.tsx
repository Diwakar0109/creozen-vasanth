import React, { useState, useEffect, useCallback } from 'react';
import { Appointment, User as DoctorUser } from '../../types';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import { Stethoscope, Calendar, User, X, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';

// A component for a single appointment row with an expandable view
const AppointmentRow = ({ appointment }: { appointment: Appointment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const visit = appointment.visit;

  return (
    <div className="border border-gray-200 rounded-lg">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <span className="font-medium text-gray-900">{appointment.patient.full_name}</span>
          <span className="text-sm text-gray-500">with Dr. {appointment.doctor.full_name}</span>
        </div>
        <div className="flex items-center space-x-3">
            <StatusBadge status={appointment.status} type="appointment" size="sm" />
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-4">Consultation Details</h4>
          {!visit ? (
            <p className="text-gray-500">No consultation has been started for this appointment yet.</p>
          ) : (
            <div className="space-y-4">
                {/* S.O.A.P Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div><strong className="text-gray-600">Subjective:</strong> <p className="text-gray-800 whitespace-pre-wrap">{visit.subjective || 'N/A'}</p></div>
                    <div><strong className="text-gray-600">Objective:</strong> <p className="text-gray-800 whitespace-pre-wrap">{visit.objective || 'N/A'}</p></div>
                    <div><strong className="text-gray-600">Assessment (Diagnosis):</strong> <p className="text-gray-800 whitespace-pre-wrap">{visit.assessment || 'N/A'}</p></div>
                    <div><strong className="text-gray-600">Plan:</strong> <p className="text-gray-800 whitespace-pre-wrap">{visit.plan || 'N/A'}</p></div>
                </div>

                {/* --- THIS IS THE NEW SECTION --- */}
                {/* Medication Details */}
                <div>
                  <strong className="text-sm text-gray-600">Medications Prescribed:</strong>
                  {visit.prescription && visit.prescription.line_items.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-gray-800">
                      {visit.prescription.line_items.map(med => (
                        <li key={med.id}>
                          <span className="font-semibold">{med.medicine_name}</span>
                          {` - ${med.dose || ''}, ${med.frequency || ''}, for ${med.duration_days} days.`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-1">No medications were prescribed for this visit.</p>
                  )}
                </div>
                {/* --- END OF NEW SECTION --- */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AllPatientsLog() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedDate) params.appointment_date = selectedDate;
      if (selectedDoctor) params.doctor_id = selectedDoctor;
      if (selectedGender) params.patient_gender = selectedGender;
      
      const response = await apiClient.get('/api/appointments/all', { params });
      setAppointments(response.data);
    } catch (error) {
      toast.error("Failed to fetch appointment logs.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, selectedDoctor, selectedGender]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch list of doctors for the filter dropdown
  useEffect(() => {
    apiClient.get('/api/users/', { params: { role: 'doctor' }})
      .then(response => setDoctors(response.data))
      .catch(() => toast.error("Failed to load doctor list."));
  }, []);
  
  const clearFilters = () => {
    setSelectedDate('');
    setSelectedDoctor('');
    setSelectedGender('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Patients Log</h1>
        <p className="text-gray-600">View and filter patient consultations across the hospital.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="flex items-center space-x-2">
            <Calendar size={18} className="text-gray-500 flex-shrink-0" />
            <label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700 sr-only">Date</label>
            <input 
              id="appointmentDate"
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="w-full border-gray-300 rounded-md shadow-sm" 
            />
        </div>
        <div className="flex items-center space-x-2">
          <Stethoscope size={18} className="text-gray-500" />
          <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
            <option value="">All Doctors</option>
            {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.full_name}</option>)}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <User size={18} className="text-gray-500" />
           <select value={selectedGender} onChange={e => setSelectedGender(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm">
            <option value="">Any Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-blue-600 flex items-center justify-center space-x-2">
            <X size={16} />
            <span>Clear Filters</span>
        </button>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-center p-6">Loading logs...</p>
        ) : appointments.length === 0 ? (
          <p className="text-center p-6 text-gray-500">No appointments found for the selected criteria.</p>
        ) : (
          appointments.map(app => <AppointmentRow key={app.id} appointment={app} />)
        )}
      </div>
    </div>
  );
}