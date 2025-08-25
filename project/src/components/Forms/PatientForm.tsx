import React, { useState } from 'react';
import { Patient } from '../../types/index';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';

interface PatientFormProps {
  initialPhone?: string;
  patient?: Patient; // For editing in the future
  onSubmit: (patient: Patient) => void;
  onCancel: () => void;
}

export default function PatientForm({ initialPhone, patient, onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState({
    full_name: patient?.full_name || '',
    phone_number: patient?.phone_number || initialPhone || '',
    date_of_birth: patient?.date_of_birth || '',
    sex: patient?.sex || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create a payload that matches the API, handling optional fields
      const payload: any = { ...formData };
      if (!payload.date_of_birth) payload.date_of_birth = null;
      if (!payload.sex) payload.sex = null;

      // NOTE: The API does not currently support updating patients.
      // This form will only handle creation for now.
      if (patient) {
        toast.error("Updating patients is not yet supported by the API.");
        // const response = await apiClient.put(`/api/patients/${patient.id}`, payload);
        // onSubmit(response.data);
      } else {
        const response = await apiClient.post('/api/patients/', payload);
        toast.success("Patient registered successfully!");
        onSubmit(response.data);
      }
    } catch(error: any) {
        const errorMessage = error.response?.data?.detail[0]?.msg || "Failed to register patient.";
        toast.error(errorMessage);
    } 
    finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text" required value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="tel" required value={formData.phone_number}
            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
            disabled={!!initialPhone || !!patient}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date" value={formData.date_of_birth}
            onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
          <select
            value={formData.sex}
            onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
          {isLoading ? 'Saving...' : (patient ? 'Update Patient' : 'Register Patient')}
        </button>
      </div>
    </form>
  );
}