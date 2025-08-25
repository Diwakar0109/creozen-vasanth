import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, User, Clock, Phone } from 'lucide-react';
import { Patient } from '../../types';
import PatientForm from '../forms/PatientForm';
import apiClient from '../../services/api';
import { toast } from './Toaster';

// A simple debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

interface PatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient?: (patient: Patient) => void;
}

export default function PatientSearchModal({ isOpen, onClose, onSelectPatient }: PatientSearchModalProps) {
  const [phone, setPhone] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  
  const debouncedPhone = useDebounce(phone, 500); // Wait 500ms after user stops typing

  useEffect(() => {
    const searchPatients = async () => {
      if (debouncedPhone.length < 3) {
        setPatients([]);
        return;
      }
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/patients/search', {
          params: { phone_number: debouncedPhone }
        });
        setPatients(response.data);
      } catch (error) {
        toast.error("Failed to search for patients.");
        setPatients([]);
      } finally {
        setIsLoading(false);
      }
    };
    searchPatients();
  }, [debouncedPhone]);

  const handleSelectPatient = (patient: Patient) => {
    onSelectPatient?.(patient);
    onClose();
  };

  const handlePatientCreated = (patient: Patient) => {
    setShowNewPatientForm(false);
    onSelectPatient?.(patient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {showNewPatientForm ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Register New Patient</h2>
            </div>
            <div className="p-6 overflow-y-auto">
              <PatientForm
                initialPhone={phone}
                onSubmit={handlePatientCreated}
                onCancel={() => setShowNewPatientForm(false)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search or Register Patient</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoading && <div className="text-center py-8">Loading...</div>}

              {!isLoading && debouncedPhone.length >= 3 && (
                <div className="space-y-3">
                   <button
                    onClick={() => setShowNewPatientForm(true)}
                    className="w-full flex items-center space-x-3 p-4 border-2 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Plus className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-blue-600">Add New Patient with phone</p>
                      <p className="text-sm text-gray-500">{phone}</p>
                    </div>
                  </button>
                  {patients.length > 0 && <h3 className="text-sm font-medium text-gray-500 pt-2">Existing patients on this number:</h3>}
                  {patients.map((patient) => (
                    <button key={patient.id} onClick={() => handleSelectPatient(patient)} className="w-full flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 text-left">
                       <User className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{patient.full_name}</p>
                         <p className="text-sm text-gray-500">{patient.sex}, DOB: {patient.date_of_birth || 'N/A'}</p>
                      </div>
                    </button>
                  ))}
                  {patients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No patients found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}