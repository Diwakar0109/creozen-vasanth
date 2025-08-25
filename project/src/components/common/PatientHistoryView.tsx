import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import apiClient from '../../services/api';
import { toast } from './Toaster';
import { Calendar } from 'lucide-react';

interface PatientHistoryViewProps {
  patientId: number;
}

export default function PatientHistoryView({ patientId }: PatientHistoryViewProps) {
  const [patientHistory, setPatientHistory] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!patientId) return;
      setHistoryLoading(true);
      try {
        const response = await apiClient.get<Appointment[]>(`/api/patients/${patientId}/appointment-history`);
        setPatientHistory(response.data);
      } catch (error) {
        toast.error("Could not load patient history.");
        setPatientHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [patientId]);

  return (
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
              <div key={visit.id} className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                <div className="border-b pb-3 mb-3">
                  <p className="font-semibold text-gray-900">
                    Date: {new Date(pastAppointment.appointment_time).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Consultant: Dr. {pastAppointment.doctor.full_name}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Subjective:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{visit.subjective || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Objective:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{visit.objective || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Assessment:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{visit.assessment || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Plan:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{visit.plan || 'N/A'}</p>
                  </div>
                </div>
                
                {visit.authored_notes && visit.authored_notes.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="font-medium text-yellow-800 text-sm">Your Private Notes:</p>
                    <p className="text-sm text-yellow-700 whitespace-pre-wrap">{visit.authored_notes[0].content}</p>
                  </div>
                )}
                
                {visit.prescription && visit.prescription.line_items.length > 0 ? (
                  <div className="mt-2">
                    <h5 className="font-medium text-gray-700 text-sm mb-2">Medications Prescribed:</h5>
                    <ul className="space-y-1 pl-5 list-disc text-sm text-gray-600">
                      {visit.prescription.line_items.map(med => (
                        <li key={med.id}>
                          <span className="font-semibold text-gray-800">{med.medicine_name}</span>
                          {' - '}
                          {med.dose || ''}, {med.frequency || ''}, for {med.duration_days} days.
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                   <div className="mt-2 text-sm text-gray-500 italic">No medications were prescribed for this visit.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}