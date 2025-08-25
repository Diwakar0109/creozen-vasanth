import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { PrescriptionRecord } from '../../types';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import PrescriptionDetailModal from '../../components/modals/PrescriptionDetailModal'; // <-- We will create this next

export default function PrescriptionQueue() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<PrescriptionRecord[]>('/api/prescriptions/queue');
      // NOTE: Your API for the queue doesn't include patient/doctor names.
      // This is okay for a list, but the detail modal will need to fetch the full object.
      // For now, we continue mocking names for the list view.
      const enhancedData = response.data.map(p => ({
          ...p,
          patientName: `Patient #${p.patient_id}`, // Mock name
      }));
      setPrescriptions(enhancedData as any);
    } catch (error) {
      toast.error("Failed to load prescription queue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleCloseModal = (didUpdate: boolean) => {
    setSelectedPrescription(null);
    if (didUpdate) {
      // If the pharmacist saved changes, refresh the queue to show the new status
      fetchQueue();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
          <p className="text-gray-600">Prescription management and dispensing</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Prescription Queue</h2>
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading prescriptions...</p>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>The prescription queue is empty.</p>
              </div>
            ) : (
              prescriptions.map((prescription: any) => (
                <div 
                  key={prescription.id} 
                  onClick={() => setSelectedPrescription(prescription)} // <-- ADDED ONCLICK
                  className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{prescription.patientName}</p>
                      <p className="text-sm text-gray-500">Prescription ID: {prescription.id}</p>
                    </div>
                    <StatusBadge status={prescription.status} type="prescription" />
                  </div>
                  <p className='text-sm text-gray-600'>{prescription.line_items.length} medicine(s) prescribed.</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Render the modal when a prescription is selected */}
      {selectedPrescription && (
        <PrescriptionDetailModal 
          prescriptionId={selectedPrescription.id}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}