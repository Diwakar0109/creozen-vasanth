import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Building, Trash2 } from 'lucide-react';
import { Hospital } from '../../types/index';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import Modal from '../../components/common/Modal';
import AddHospitalForm from '../../components/forms/AddHospitalForm';

export default function ManageHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/hospitals/');
      setHospitals(response.data);
    } catch (error) {
      toast.error("Failed to fetch hospitals.");
      setHospitals([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleHospitalAdded = () => {
    setIsModalOpen(false);
    fetchHospitals(); // Refresh the list after adding a new hospital
  };

  const handleDeleteHospital = async (hospital: Hospital) => {
    // Show a confirmation dialog before proceeding with a destructive action
    if (window.confirm(`Are you sure you want to permanently delete "${hospital.name}" and all its associated users, patients, and appointments? This action cannot be undone.`)) {
      try {
        const response = await apiClient.delete(`/api/hospitals/${hospital.id}`);
        toast.success(response.data.msg);
        fetchHospitals(); // Refresh the list after deletion
      } catch (error: any) {
        toast.error(error.response?.data?.detail || "Failed to delete hospital.");
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Hospitals</h1>
            <p className="text-gray-600">Onboard new hospitals and their administrators.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Hospital</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Hospital ID</th>
                <th scope="col" className="px-6 py-3">Hospital Name</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center p-6 text-gray-500">Loading hospitals...</td></tr>
              ) : hospitals.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-6 text-gray-500">No hospitals found. Click "Add New Hospital" to get started.</td></tr>
              ) : (
                hospitals.map(hospital => (
                  <tr key={hospital.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{hospital.id}</td>
                    <td className="px-6 py-4">{hospital.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteHospital(hospital)}
                        className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Hospital & Admin">
        <AddHospitalForm onSubmit={handleHospitalAdded} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}