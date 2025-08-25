import React, { useState, useEffect } from 'react';
import { X, Send, User, Calendar, Pill, Trash2, Info, PlusCircle } from 'lucide-react';
import { Appointment, Visit, PrescriptionMedicine } from '../../types/index';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';

// Helper function to create a blank medicine row
const createEmptyMedicine = () => ({
  medicine_name: '',
  dose: '',
  frequency: '',
  duration_days: 7, // A sensible default
  instructions: ''
});

// Helper function to determine the initial state of the medicine list
const getInitialMedicines = (appointment: Appointment): Omit<PrescriptionMedicine, 'id' | 'status'>[] => {
  const existingItems = appointment.visit?.prescription?.line_items;

  // If there are existing prescription items, use them.
  if (existingItems && existingItems.length > 0) {
    return existingItems.map(item => ({
      medicine_name: item.medicine_name,
      dose: item.dose || '',
      frequency: item.frequency || '',
      duration_days: item.duration_days || 0,
      instructions: item.instructions || ''
    }));
  }

  // Otherwise, if this is a new consultation, create 5 empty placeholders.
  return Array.from({ length: 5 }, createEmptyMedicine);
};


interface ConsultationModalProps {
  appointment: Appointment;
  onClose: () => void;
}

export default function ConsultationModal({ appointment, onClose }: ConsultationModalProps) {
  const patient = appointment.patient;
  
  // The history state now holds full Appointment objects to get the date
  const [patientHistory, setPatientHistory] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const isEditable = !appointment.visit?.prescription || 
                     appointment.visit.prescription.status === 'Created';

  const [visitData, setVisitData] = useState({ subjective: '', objective: '', assessment: '', plan: '', private_note: '' });
  const [prescriptionMedicines, setPrescriptionMedicines] = useState(() => getInitialMedicines(appointment));
  
  // This useEffect synchronizes the state if the appointment prop changes
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

  // UI states
  const [activeTab, setActiveTab] = useState('consultation');
  const [isSaving, setIsSaving] = useState(false);

  // History fetching useEffect
  useEffect(() => {
    const fetchHistory = async () => {
      if (activeTab === 'history' && patient?.id) {
        setHistoryLoading(true);
        try {
          // Use the new endpoint that returns full appointment objects
          const response = await apiClient.get<Appointment[]>(`/api/patients/${patient.id}/appointment-history`);
          setPatientHistory(response.data);
        } catch (error) {
          toast.error("Could not load patient history.");
          setPatientHistory([]);
        } finally {
          setHistoryLoading(false);
        }
      }
    };
    fetchHistory();
  }, [activeTab, patient?.id]);

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
            <p className="text-sm text-yellow-800 font-medium">
              This record is in read-only mode because the prescription has been partially or fully dispensed by the pharmacy.
            </p>
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
            <div>
                <h3 className="font-semibold text-gray-900 mb-4">Visit History</h3>
                {historyLoading ? (
                    <p>Loading history...</p>
                ) : patientHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p>No previous completed visits found for this patient.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {patientHistory.map(pastAppointment => {
                          const visit = pastAppointment.visit;
                          if (!visit) return null;

                          return (
                            <div key={visit.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                                <div className="mb-3">
                                    <p className="font-medium text-gray-800">
                                        Date: {new Date(pastAppointment.appointment_time).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Consultant: Dr. {pastAppointment.doctor.full_name}
                                    </p>
                                </div>
                                {visit.assessment && <p className="text-sm"><strong className="font-medium text-gray-600">Assessment:</strong> {visit.assessment}</p>}
                                {visit.authored_notes && visit.authored_notes.length > 0 && (
                                    <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                                        <p className="font-medium text-yellow-800 text-sm">Your Private Notes:</p>
                                        <p className="text-sm text-yellow-700">{visit.authored_notes[0].content}</p>
                                    </div>
                                )}
                                {visit.prescription && visit.prescription.line_items.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="font-medium text-gray-700 text-sm mb-2">Medications Prescribed:</h5>
                                        <ul className="space-y-2 pl-4 list-disc text-sm text-gray-600">
                                            {visit.prescription.line_items.map(med => (
                                                <li key={med.id}>
                                                    <span className="font-semibold text-gray-800">{med.medicine_name}</span>
                                                    {' - '}
                                                    {med.dose || ''}, {med.frequency || ''}, for {med.duration_days} days.
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {(!visit.prescription || visit.prescription.line_items.length === 0) && (
                                   <div className="mt-4 text-sm text-gray-500 italic">No medications were prescribed for this visit.</div>
                                )}
                            </div>
                          )
                        })}
                    </div>
                )}
             </div>
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