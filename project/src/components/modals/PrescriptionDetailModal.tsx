import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Prescription, PrescriptionRecord, Patient } from '../../types';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';

interface DispenseUpdate {
  line_item_id: number;
  status: 'Given' | 'Partially Given' | 'Not Given' | 'Substituted';
  substitution_info?: string | null;
}

interface PrescriptionDetailModalProps {
  prescriptionId: number | null;
  onClose: (didUpdate: boolean) => void;
}

interface FullPrescription extends PrescriptionRecord {
    patient: Patient;
}

export default function PrescriptionDetailModal({ prescriptionId, onClose }: PrescriptionDetailModalProps) {
  const [prescription, setPrescription] = useState<FullPrescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updates, setUpdates] = useState<DispenseUpdate[]>([]);

  useEffect(() => {
    if (prescriptionId) {
      const fetchPrescriptionDetails = async () => {
        setIsLoading(true);
        try {
          const response = await apiClient.get<FullPrescription>(`/api/prescriptions/${prescriptionId}`);
          setPrescription(response.data);
          const initialUpdates = response.data.line_items.map(item => ({
              line_item_id: item.id,
              status: item.status,
              substitution_info: item.substitution_info
          }));
          setUpdates(initialUpdates);
        } catch (error) {
          toast.error("Failed to load prescription details.");
          onClose(false);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPrescriptionDetails();
    }
  }, [prescriptionId, onClose]);

  const handleStatusChange = (itemId: number, newStatus: DispenseUpdate['status']) => {
    setUpdates(prev => prev.map(up => up.line_item_id === itemId ? { ...up, status: newStatus } : up));
  };
  
  const handleSubstitutionInfoChange = (itemId: number, info: string) => {
    setUpdates(prev => prev.map(up => up.line_item_id === itemId ? { ...up, substitution_info: info } : up));
  }

  const handleSaveChanges = async () => {
    if (!prescriptionId) return;
    setIsSaving(true);
    try {
        // --- THE FIX IS HERE ---
        // Send the 'updates' array directly as the request body
        await apiClient.put(`/api/prescriptions/${prescriptionId}/dispense`, updates);
        toast.success("Dispense status updated successfully.");
        onClose(true);
    } catch(error) {
        toast.error("Failed to save changes.");
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Dispense Prescription</h2>
          <button onClick={() => onClose(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">Loading details...</div>
        ) : prescription && (
          <>
            <div className="p-6 border-b">
              <p><span className="font-medium">Patient:</span> {prescription.patient.full_name}</p>
              <p><span className="font-medium">Prescription ID:</span> {prescription.id}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {prescription.line_items.map(item => {
                const currentUpdate = updates.find(u => u.line_item_id === item.id);
                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    <p className="font-bold text-lg">{item.medicine_name}</p>
                    <p className="text-sm text-gray-600">{item.dose} - {item.frequency} - {item.duration_days} days</p>
                    {item.instructions && <p className="text-sm text-blue-600 mt-1"><em>Instructions: {item.instructions}</em></p>}
                    
                    <div className="mt-4 flex items-center space-x-2">
                        <label className="text-sm font-medium">Status:</label>
                        <select 
                            value={currentUpdate?.status || 'Not Given'} 
                            onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                            className="border rounded px-2 py-1"
                        >
                            <option value="Not Given">Not Given</option>
                            <option value="Given">Given</option>
                            <option value="Partially Given">Partially Given</option>
                            <option value="Substituted">Substituted</option>
                        </select>
                    </div>

                    {currentUpdate?.status === 'Substituted' && (
                        <div className="mt-2">
                            <label className="text-sm font-medium">Substitution Info:</label>
                            <input 
                                type="text"
                                placeholder="e.g., Substituted with Amoxicillin due to stock"
                                value={currentUpdate?.substitution_info || ''}
                                onChange={e => handleSubstitutionInfoChange(item.id, e.target.value)}
                                className="w-full border rounded p-2 mt-1"
                            />
                        </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="px-6 py-4 border-t flex justify-end space-x-3">
              <button onClick={() => onClose(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={handleSaveChanges} disabled={isSaving} className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Dispense Status'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}