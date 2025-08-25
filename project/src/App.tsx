import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './pages/auth/LoginForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import PrescriptionQueue from './pages/pharmacy/PrescriptionQueue';
import AppLayout from './components/Layout/AppLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ManageUsers from './pages/admin/ManageUsers';
import { Toaster } from './components/common/Toaster'; // A new simple component for notifications
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import ManagePatients from './pages/doctor/ManagePatients'; 
import ManageStaff from './pages/doctor/ManageStaff';
import AllPatientsLog from './pages/nurse/AllPatientsLog';
import ManageHospitals from './pages/superadmin/ManageHospitals';





const HomeRedirect = () => {
  const { currentRole } = useAuth();
  switch (currentRole) {
    case 'super_admin':
      return <Navigate to="/super/hospitals" />;
    case 'admin':
      return <Navigate to="/admin/dashboard" />;
    case 'doctor':
      return <Navigate to="/doctor/dashboard" />;
    case 'nurse':
      return <Navigate to="/nurse/dashboard" />;
    case 'medical_shop':
      return <Navigate to="/pharmacy/dashboard" />;
    default:
      return <Navigate to="/login" />;
  }
};

function AppContent() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginForm /> : <HomeRedirect />} />
      
      {/* Routes accessible when logged in, wrapped in the main layout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/super/hospitals" element={<ProtectedRoute allowedRoles={['super_admin']}><ManageHospitals /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/manage-doctors" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers userRole="doctor" title="Doctors" /></ProtectedRoute>} />
        <Route path="/admin/manage-nurses" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers userRole="nurse" title="Nurses" /></ProtectedRoute>} />
        <Route path="/admin/manage-shops" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers userRole="medical_shop" title="Medical Shops" /></ProtectedRoute>} />
        
        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><ManagePatients /></ProtectedRoute>} />
        <Route path="/doctor/manage-nurses" element={<ProtectedRoute allowedRoles={['doctor']}><ManageStaff userRole="nurse" title="Nurses" /></ProtectedRoute>} />
        <Route path="/doctor/manage-shops" element={<ProtectedRoute allowedRoles={['doctor']}><ManageStaff userRole="medical_shop" title="Medical Shops" /></ProtectedRoute>} />
        
        {/* Nurse Routes */}
        <Route path="/nurse/dashboard" element={<ProtectedRoute allowedRoles={['nurse']}><NurseDashboard /></ProtectedRoute>} />
        <Route path="/nurse/all-patients" element={<ProtectedRoute allowedRoles={['nurse']}><AllPatientsLog /></ProtectedRoute>} />
        
        {/* Pharmacy Routes */}
        <Route path="/pharmacy/dashboard" element={<ProtectedRoute allowedRoles={['medical_shop']}><PharmacyDashboard /></ProtectedRoute>} />
        <Route path="/pharmacy/queue" element={<ProtectedRoute allowedRoles={['medical_shop']}><PrescriptionQueue /></ProtectedRoute>} />        {/* Add more specific routes like prescription detail later */}
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <AppContent />
    </AuthProvider>
  );
}