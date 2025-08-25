import { useState, useEffect } from 'react';
import { Plus, UserCheck, ShoppingBag, KeyRound } from 'lucide-react'; // <-- Import KeyRound icon
import apiClient from '../../services/api';
import { User, UserRole } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import AddUserModal from '../../components/modals/AddUserModal';
import { toast } from '../../components/common/Toaster';

interface ManageStaffProps {
  userRole: 'nurse' | 'medical_shop';
  title: string;
}

export default function ManageStaff({ userRole, title }: ManageStaffProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/users/my-staff', {
        params: { role: userRole }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error(`Failed to fetch ${title}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userRole]);

  const handleUserAdded = () => {
    setIsModalOpen(false);
    fetchUsers();
  };

  const toggleUserStatus = async (userToUpdate: User) => {
    const action = userToUpdate.is_active ? 'Deactivate' : 'Activate';
    if (window.confirm(`Are you sure you want to ${action} ${userToUpdate.full_name}?`)) {
        try {
            await apiClient.put(`/api/users/${userToUpdate.id}`, { is_active: !userToUpdate.is_active });
            toast.success(`User status updated for ${userToUpdate.full_name}`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status.');
        }
    }
  }

  // --- ADD THIS NEW FUNCTION ---
  const handleResetPassword = async (userToReset: User) => {
    if (window.confirm(`Are you sure you want to initiate a password reset for ${userToReset.full_name}?`)) {
      try {
        const response = await apiClient.post(`/api/users/${userToReset.id}/reset-password`);
        toast.success(response.data.msg);
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to reset password.');
      }
    }
  };

  const getIcon = () => {
    switch (userRole) {
      case 'nurse': return <UserCheck className="h-6 w-6 text-green-600" />;
      case 'medical_shop': return <ShoppingBag className="h-6 w-6 text-orange-600" />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className='flex items-center space-x-3'>
            {getIcon()}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage {title}</h1>
                <p className="text-gray-600">Add, view, and manage accounts.</p>
            </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Add New {title.slice(0, -1)}</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Full Name</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="text-center p-6">Loading...</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.full_name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.is_active ? 'active' : 'inactive'} type='user' /></td>
                  <td className="px-6 py-4 space-x-4"> {/* <-- MODIFICATION: Add space-x-4 for spacing */}
                     <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`text-sm font-medium ${user.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                     </button>
                     {/* --- ADD THIS NEW BUTTON --- */}
                     <button
                        onClick={() => handleResetPassword(user)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-800"
                     >
                        Reset Password
                     </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={userRole}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}