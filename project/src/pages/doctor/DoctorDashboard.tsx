import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Play, CheckCircle, Pill } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import PrescriptionStatusBadge from '../../components/common/PrescriptionStatusBadge';
import ConsultationModal from '../../components/modals/ConsultationModal';
import apiClient from '../../services/api';
import { Appointment } from '../../types/index';
import { toast } from '../../components/common/Toaster';

const formatAppointmentTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) {
    return 'No Time';
  }
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return 'Invalid Time';
  }
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingConsultation, setIsStartingConsultation] = useState<number | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get<Appointment[]>('/api/appointments/', {
        params: { appointment_date: today }
      });
      console.log("DEBUG: Raw API Response for Dashboard:", response.data);

      const myAppointments = response.data
        .filter(apt => apt.doctor.id === user?.id)
        .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
        
      setAppointments(myAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleStartConsultation = async (appointmentToStart: Appointment) => {
    setIsStartingConsultation(appointmentToStart.id);
    try {
      const response = await apiClient.put<Appointment>(`/api/appointments/${appointmentToStart.id}/status/start`);
      setAppointments(prev => prev.map(a => a.id === response.data.id ? response.data : a));
      setSelectedAppointment(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to start consultation.");
    } finally {
      setIsStartingConsultation(null);
    }
  };
  
  const handleCloseConsultation = () => {
    setSelectedAppointment(null);
    fetchAppointments(); // Re-fetch to get the latest state after modal closes
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Today's schedule and consultations for Dr. {user?.full_name}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Appointments</h2>
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading appointments...</p>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No appointments scheduled for today.</p>
              </div>
            ) : (
              appointments.map((appointment) => {
                const prescription = appointment.visit?.prescription;

                const isViewable = appointment.status === 'Completed' || appointment.status === 'In-Consultation';
                const rowClasses = `flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  isViewable ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'
                }`;

                return (
                  <div 
                    key={appointment.id} 
                    className={rowClasses}
                    onClick={() => {
                      if (isViewable) {
                        console.log("DEBUG: Passing this appointment object to modal:", appointment);

                        setSelectedAppointment(appointment);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 min-w-[90px]">
                        <Clock className="h-4 w-4" />
                        <span>{formatAppointmentTime(appointment.appointment_time)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{appointment.patient.full_name}</span>
                      </div>
                      <StatusBadge status={appointment.status} type="appointment" size="sm" />
                      
                      {appointment.status === 'Completed' && (
                        prescription ? (
                          <PrescriptionStatusBadge status={prescription.status} />
                        ) : (
                          <div className="inline-flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                            <Pill className="h-3 w-3" />
                            <span>No Rx Issued</span>
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex items-center space-x-4 ml-4 flex-shrink-0">
                      {appointment.visit_purpose && <span className="text-sm text-gray-500 italic hidden md:inline">"{appointment.visit_purpose}"</span>}
                      
                      {appointment.status === 'Scheduled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent the row's onClick from firing
                            handleStartConsultation(appointment);
                          }}
                          disabled={isStartingConsultation === appointment.id}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          <span>{isStartingConsultation === appointment.id ? 'Starting...': 'Start'}</span>
                        </button>
                      )}

                       {appointment.status === 'In-Consultation' && (
                          <div className="flex items-center space-x-1 text-orange-600">
                              <span className="text-sm font-medium">In Progress...</span>
                          </div>
                      )}

                       {appointment.status === 'Completed' && (
                          <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">View Details</span>
                          </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
      {selectedAppointment && (
        <ConsultationModal appointment={selectedAppointment} onClose={handleCloseConsultation} />
      )}
    </>
  );
}