import React, { useState, useEffect } from 'react';
import { X, Send, User, Pill, Trash2, Info, PlusCircle } from 'lucide-react';
import { Appointment, PrescriptionMedicine } from '../../types/index';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';
import PatientHistoryView from '../common/PatientHistoryView'; // Import the reusable component

// Helper function to create a blank medicine row
const createEmptyMedicine = () => ({
  medicine_name: '',
  dose: '',
  frequency: '',
  duration_days: 7,
  instructions: ''
});

// Helper function to determine the initial state of the medicine list
const getInitialMedicines = (appointment: Appointment): Omit<PrescriptionMedicine, 'id' | 'status'>[] => {
  const existingItems = appointment.visit?.prescription?.line_items;
  if (existingItems && existingItems.length > 0) {
    return existingItems.map(item => ({
      medicine_name: item.medicine_name,
      dose: item.dose || '',
      frequency: item.frequency || '',
      duration_days: item.duration_days || 0,
      instructions: item.instructions || ''
    }));
  }
  return Array.from({ length: 5 }, createEmptyMedicine);
};

interface ConsultationModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export default function ConsultationModal({ appointment, onClose }: ConsultationModalProps) {
  const patient = appointment.patient;
  
  // History state is now managed by the PatientHistoryView component
  
  const isEditable = !appointment.visit?.prescription || 
                     appointment.visit.prescription.status === 'Created';

  const [visitData, setVisitData] = useState({ subjective: '', objective: '', assessment: '', plan: '', private_note: '' });
  const [prescriptionMedicines, setPrescriptionMedicines] = useState(() => getInitialMedicines(appointment));
  
  useEffect(() => {
    if (appointment) {
      setVisitData({
        subjective: appointment.visit?.subjective || '',
        objective: appointment.visit?.objective || '',
        assessment: appointment.visit?.assessment || '',
        plan: appointment.visit?.plan || '',
        private_note: appointment.visit?.authored_notes?.[0]?.content || ''
      });
      setPrescriptionMedicines(getInitialMedicines(appointment));
    }
  }, [appointment]);

  const [activeTab, setActiveTab] = useState('consultation');
  const [isSaving, setIsSaving] = useState(false);

  // History fetching logic has been removed from this component.

  const addMedicineRow = () => {
    setPrescriptionMedicines(prev => [...prev, createEmptyMedicine()]);
  };

  const removeMedicine = (index: number) => {
    setPrescriptionMedicines(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleMedicineChange = (index: number, field: string, value: string | number) => {
    setPrescriptionMedicines(prev => {
      const newMedicines = [...prev];
      newMedicines[index] = { ...newMedicines[index], [field]: value };
      return newMedicines;
    });
  };

  const handleSaveVisit = async () => {
    setIsSaving(true);
    try {
      const validMedicines = prescriptionMedicines.filter(
        med => med.medicine_name.trim() !== '' && med.dose.trim() !== '' && med.frequency.trim() !== ''
      );
      const payload = {
        visit_details: visitData,
        prescription_details: { line_items: validMedicines }
      };
      await apiClient.put(`/api/appointments/${appointment.id}/status/complete`, payload);
      toast.success("Visit details saved successfully.");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save visit details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!patient) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{patient.full_name} ({patient.sex}, DOB: {patient.date_of_birth || 'N/A'})</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="px-6 flex space-x-8">
            <button onClick={() => setActiveTab('consultation')} className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'consultation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Consultation</button>
            <button onClick={() => setActiveTab('history')} className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Patient History</button>
            <button onClick={() => setActiveTab('prescription')} className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'prescription' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Prescription</button>
          </nav>
        </div>
        
        {!isEditable && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center space-x-3">
            <Info className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 font-medium">This record is read-only because the prescription has been dispensed.</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'consultation' && (
            <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                  <textarea disabled={!isEditable} rows={4} value={visitData.subjective} onChange={(e) => setVisitData(prev => ({ ...prev, subjective: e.target.value }))} className="w-full border rounded-md p-2 disabled:bg-gray-100"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                  <textarea disabled={!isEditable} rows={4} value={visitData.objective} onChange={(e) => setVisitData(prev => ({ ...prev, objective: e.target.value }))} className="w-full border rounded-md p-2 disabled:bg-gray-100"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment (Diagnosis)</label>
                  <textarea disabled={!isEditable} rows={4} value={visitData.assessment} onChange={(e) => setVisitData(prev => ({ ...prev, assessment: e.target.value }))} className="w-full border rounded-md p-2 disabled:bg-gray-100"/>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <textarea disabled={!isEditable} rows={4} value={visitData.plan} onChange={(e) => setVisitData(prev => ({ ...prev, plan: e.target.value }))} className="w-full border rounded-md p-2 disabled:bg-gray-100"/>
                </div>
                 <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private Clinical Notes (Only visible to you)</label>
                  <textarea disabled={!isEditable} rows={3} value={visitData.private_note} onChange={(e) => setVisitData(prev => ({ ...prev, private_note: e.target.value }))} className="w-full border rounded-md p-2 disabled:bg-gray-100"/>
                </div>
            </div>
          )}

          {activeTab === 'history' && (
             <PatientHistoryView patientId={patient.id} />
          )}

          {activeTab === 'prescription' && (
             <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Prescription</h3>
                <div className="space-y-3">
                    {prescriptionMedicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-12 gap-x-3 gap-y-2 items-center p-2 rounded-lg hover:bg-gray-50">
                            <div className="col-span-12 sm:col-span-3">
                                {index === 0 && <label className="text-xs font-medium text-gray-500">Medicine Name *</label>}
                                <input disabled={!isEditable} value={med.medicine_name} onChange={e => handleMedicineChange(index, 'medicine_name', e.target.value)} className="w-full border rounded-md p-2 mt-1 disabled:bg-gray-100"/>
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                               {index === 0 && <label className="text-xs font-medium text-gray-500">Dose *</label>}
                               <input disabled={!isEditable} value={med.dose} onChange={e => handleMedicineChange(index, 'dose', e.target.value)} className="w-full border rounded-md p-2 mt-1 disabled:bg-gray-100"/>
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                               {index === 0 && <label className="text-xs font-medium text-gray-500">Frequency *</label>}
                               <input disabled={!isEditable} value={med.frequency} onChange={e => handleMedicineChange(index, 'frequency', e.target.value)} className="w-full border rounded-md p-2 mt-1 disabled:bg-gray-100"/>
                            </div>
                            <div className="col-span-6 sm:col-span-1">
                               {index === 0 && <label className="text-xs font-medium text-gray-500">Days</label>}
                               <input disabled={!isEditable} type="number" value={med.duration_days} onChange={e => handleMedicineChange(index, 'duration_days', parseInt(e.target.value) || 0)} className="w-full border rounded-md p-2 mt-1 disabled:bg-gray-100"/>
                            </div>
                            <div className="col-span-6 sm:col-span-3">
                                {index === 0 && <label className="text-xs font-medium text-gray-500">Instructions</label>}
                                <input disabled={!isEditable} value={med.instructions} onChange={e => handleMedicineChange(index, 'instructions', e.target.value)} className="w-full border rounded-md p-2 mt-1 disabled:bg-gray-100"/>
                            </div>
                             <div className="col-span-12 sm:col-span-1 flex items-end justify-start sm:justify-center">
                                {isEditable && (
                                    <button onClick={() => removeMedicine(index)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {isEditable && (
                  <div className="pt-2">
                    <button 
                      onClick={addMedicineRow} 
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg"
                    >
                      <PlusCircle size={16} />
                      <span>Add Another Medicine</span>
                    </button>
                  </div>
                )}
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end space-x-3">
            {isEditable ? (
              <>
                <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                <button onClick={handleSaveVisit} disabled={isSaving} className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                  <Send className="h-4 w-4" />
                  <span>{appointment.status === 'In-Consultation' ? 'Complete Visit' : 'Save Changes'}</span>
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Close</button>
            )}
        </div>
      </div>
    </div>
  );
}