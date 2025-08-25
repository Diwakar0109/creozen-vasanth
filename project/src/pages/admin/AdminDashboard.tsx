import { useState, useEffect } from 'react';
import { Users, Calendar, Stethoscope, ShoppingBag } from 'lucide-react';
import AddUserModal from '../../components/modals/AddUserModal';
import { UserRole, Appointment, PrescriptionRecord } from '../../types';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';

type StatCardProps = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const StatCard = ({ label, value, icon: Icon, color, bg }: StatCardProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`${bg} p-3 rounded-lg`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  </div>
);


export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRoleToAdd, setUserRoleToAdd] = useState<UserRole | null>(null);
  const [stats, setStats] = useState({
    appointments: 0,
    doctors: 0,
    pendingDispenses: 0,
    nurses: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        // Parallel API calls for efficiency
        const [apptRes, doctorRes, nurseRes, pharmacyRes] = await Promise.all([
          apiClient.get<Appointment[]>('/api/appointments/', { params: { date: today } }),
          apiClient.get('/api/users/', { params: { role: 'doctor', is_active: true } }),
          apiClient.get('/api/users/', { params: { role: 'nurse', is_active: true } }),
          apiClient.get<PrescriptionRecord[]>('/api/prescriptions/queue')
        ]);

        const pendingCount = pharmacyRes.data.filter(p => p.status === 'Created' || p.status === 'Partially Dispensed').length;

        setStats({
          appointments: apptRes.data.length,
          doctors: doctorRes.data.length,
          nurses: nurseRes.data.length,
          pendingDispenses: pendingCount
        });
      } catch (error) {
        toast.error("Failed to load dashboard data.");
      }
    };
    fetchDashboardData();
  }, []);
  
  const handleOpenModal = (role: UserRole) => {
    setUserRoleToAdd(role);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserRoleToAdd(null);
  };
  
  const statCards = [
    { label: "Today's Appointments", value: stats.appointments, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Doctors', value: stats.doctors, icon: Stethoscope, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pending Pharmacy', value: stats.pendingDispenses, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Active Nurses', value: stats.nurses, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Hospital management overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => <StatCard key={index} {...stat} />)}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => handleOpenModal('doctor')} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Add Doctor</span>
          </button>
          <button onClick={() => handleOpenModal('nurse')} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <Users className="h-5 w-5 text-green-600" />
            <span className="font-medium">Add Nurse</span>
          </button>
          <button onClick={() => handleOpenModal('medical_shop')} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <ShoppingBag className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Add Medical Shop</span>
          </button>
        </div>
      </div>
      
      {/* AddUserModal needs onUserAdded to refresh data, but for dashboard it's not critical */}
      <AddUserModal isOpen={isModalOpen} onClose={handleCloseModal} role={userRoleToAdd} onUserAdded={handleCloseModal} />
    </div>
  );
}