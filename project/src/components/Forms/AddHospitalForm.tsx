import React, { useState } from 'react';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';

interface AddHospitalFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export default function AddHospitalForm({ onSubmit, onCancel }: AddHospitalFormProps) {
  const [formData, setFormData] = useState({
    name: '', // Hospital name
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/api/hospitals/', formData);
      toast.success("Hospital and Admin created successfully!");
      onSubmit();
    } catch(error: any) {
        toast.error(error.response?.data?.detail || "Failed to create hospital.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Hospital Details</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
          <input
            type="text" required value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Initial Administrator Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Full Name *</label>
              <input
                type="text" required value={formData.admin_full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
              <input
                type="email" required value={formData.admin_email}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Initial Password *</label>
              <input
                type="password" required value={formData.admin_password}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
          {isLoading ? 'Creating...' : 'Create Hospital & Admin'}
        </button>
      </div>
    </form>
  );
}