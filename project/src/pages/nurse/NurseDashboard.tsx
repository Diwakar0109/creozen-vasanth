import { useState, useEffect } from 'react';
import { Calendar, Clock, User as UserIcon } from 'lucide-react'; // Renamed User to avoid conflict
import StatusBadge from '../../components/common/StatusBadge';
import AppointmentForm from '../../components/forms/AppointmentForm';
import { Appointment, User } from '../../types/index'; // <-- THE FIX IS HERE
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';

export default function NurseDashboard() {
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await apiClient.get<Appointment[]>('/api/appointments', { params: { date: today }});
        setAppointments(response.data);
    } catch (error) {
        toast.error("Failed to fetch today's appointments");
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAppointmentCreated = () => {
    setShowAppointmentForm(false);
    fetchAppointments(); // Refresh the list
  }
  
  // Group appointments by doctor for the UI
  const appointmentsByDoctor = appointments.reduce((acc, curr) => {
    const doctorId = curr.doctor.id.toString();
    if (!acc[doctorId]) {
      acc[doctorId] = { doctorName: curr.doctor.full_name, appointments: [] };
    }
    acc[doctorId].appointments.push(curr);
    return acc;
  }, {} as Record<string, { doctorName: string; appointments: Appointment[] }>);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nurse Dashboard</h1>
          <p className="text-gray-600">Patient coordination and appointment management</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <button 
            onClick={() => setShowAppointmentForm(true)}
            className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors w-full md:w-auto"
          >
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Create New Appointment</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Schedule ({appointments.length} total)</h2>
          {isLoading ? (
            <p>Loading schedule...</p>
          ) : Object.keys(appointmentsByDoctor).length === 0 ? (
            <p className="text-center text-gray-500 py-4">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-6">
            {Object.entries(appointmentsByDoctor).map(([doctorId, data]) => (
              <div key={doctorId} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">Dr. {data.doctorName}</h3>
                <div className="space-y-2">
                  {data.appointments.map(appointment => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className='text-sm'>{new Date(appointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{appointment.patient.full_name}</span>
                      </div>
                      <StatusBadge status={appointment.status} type="appointment" size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Create New Appointment</h2>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <AppointmentForm onSubmit={handleAppointmentCreated} onCancel={() => setShowAppointmentForm(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}