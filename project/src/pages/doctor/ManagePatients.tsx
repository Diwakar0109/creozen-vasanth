import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, CalendarPlus, Search, X, Play, FileClock } from 'lucide-react';
import { Patient, Appointment } from '../../types';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import PatientForm from '../../components/forms/PatientForm';
import AppointmentForm from '../../components/forms/AppointmentForm';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PatientHistoryView from '../../components/common/PatientHistoryView'; // Import the reusable component

// Simple debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

type ModalStep = 'newPatient' | 'newAppointment' | 'confirmStartConsultation';

export default function ManagePatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [modalStep, setModalStep] = useState<ModalStep | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  // New state for the dedicated history modal
  const [patientForHistory, setPatientForHistory] = useState<Patient | null>(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { skip: 0, limit: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedDate) params.appointment_date = selectedDate;
      const response = await apiClient.get('/api/patients/', { params });
      setPatients(response.data);
    } catch (error) {
      toast.error("Failed to fetch patients.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedDate]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  const handlePatientCreated = (newPatient: Patient) => {
    setActivePatient(newPatient);
    setModalStep('newAppointment');
    fetchPatients();
  };

  const handleAppointmentCreated = (newAppointment: Appointment) => {
    setActiveAppointment(newAppointment);
    setModalStep('confirmStartConsultation');
  };

  const handleStartConsultation = async () => {
    if (!activeAppointment) return;
    try {
      await apiClient.put(`/api/appointments/${activeAppointment.id}/status/start`);
      toast.success("Consultation started!");
      closeModal();
      navigate('/doctor/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to start consultation.");
    }
  };

  const openNewPatientModal = () => {
    setActivePatient(null);
    setActiveAppointment(null);
    setModalStep('newPatient');
  };

  const openAppointmentModalForExistingPatient = (patient: Patient) => {
    setActivePatient(patient);
    setActiveAppointment(null);
    setModalStep('newAppointment');
  };

  const closeModal = () => {
    setModalStep(null);
    setActivePatient(null);
    setActiveAppointment(null);
  };
  
  const getModalTitle = (): string => {
    switch(modalStep) {
      case 'newPatient': return 'Register New Patient';
      case 'newAppointment': return `Book Appointment for ${activePatient?.full_name}`;
      case 'confirmStartConsultation': return 'Appointment Created';
      default: return '';
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
            <p className="text-gray-600">Search, add, and book appointments for patients.</p>
          </div>
          <button
            onClick={openNewPatientModal}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Patient & Book</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
             <label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">Appointment on:</label>
             <input
              id="appointmentDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Full Name</th>
                <th scope="col" className="px-6 py-3">Phone Number</th>
                <th scope="col" className="px-6 py-3">DOB / Sex</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center p-6">Loading patients...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-6 text-gray-500">No patients found.</td></tr>
              ) : patients.map(patient => (
                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{patient.full_name}</td>
                  <td className="px-6 py-4">{patient.phone_number}</td>
                  <td className="px-6 py-4">{patient.date_of_birth || 'N/A'} / {patient.sex || 'N/A'}</td>
                  <td className="px-6 py-4 flex items-center space-x-4">
                     <button 
                        onClick={() => openAppointmentModalForExistingPatient(patient)}
                        className="font-medium text-blue-600 hover:underline flex items-center space-x-1">
                        <CalendarPlus size={16} />
                        <span>Book Appointment</span>
                     </button>
                     <button 
                        onClick={() => setPatientForHistory(patient)}
                        className="font-medium text-gray-600 hover:underline flex items-center space-x-1">
                        <FileClock size={16} />
                        <span>View History</span>
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Multi-step modal for creating a new patient/appointment flow */}
      <Modal isOpen={!!modalStep} onClose={closeModal} title={getModalTitle()}>
        {modalStep === 'newPatient' && (
          <PatientForm onSubmit={handlePatientCreated} onCancel={closeModal} />
        )}
        {modalStep === 'newAppointment' && activePatient && user && (
          <AppointmentForm
            patient={activePatient}
            defaultDoctorId={user.id}
            onSubmit={handleAppointmentCreated}
            onCancel={closeModal}
          />
        )}
        {modalStep === 'confirmStartConsultation' && (
          <div className="text-center space-y-6">
            <p className="text-lg">Appointment booked successfully for {activePatient?.full_name}.</p>
            <p className="text-gray-600">Would you like to start the consultation now?</p>
            <div className="flex justify-center space-x-4 pt-4">
              <button onClick={closeModal} className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium">Not Now</button>
              <button
                onClick={handleStartConsultation}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
              >
                <Play size={16} />
                <span>Start Consultation</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dedicated modal for viewing patient history */}
      {patientForHistory && (
        <Modal 
          isOpen={!!patientForHistory} 
          onClose={() => setPatientForHistory(null)} 
          title={`History for ${patientForHistory.full_name}`}
        >
          <PatientHistoryView patientId={patientForHistory.id} />
        </Modal>
      )}
    </>
  );
}