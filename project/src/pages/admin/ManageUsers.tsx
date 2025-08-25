import { useState, useEffect } from 'react';
import { Plus, UserCog } from 'lucide-react';
import apiClient from '../../services/api';
import { User, UserRole } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import AddUserModal from '../../components/modals/AddUserModal';
import { toast } from '../../components/common/Toaster';

interface ManageUsersProps {
  userRole: 'doctor' | 'nurse' | 'medical_shop'; // Using uppercase to match App.tsx
  title: string;
}

export default function ManageUsers({ userRole, title }: ManageUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching users with role: ${userRole.toLowerCase()}`);

      // API call to fetch users of a specific role for the admin's hospital
      const response = await apiClient.get('/api/users/', { params: { role: userRole.toLowerCase() } });
      console.log("API Response Data:", response.data)
      setUsers(response.data);
    } catch (error) {
      console.error("API Error fetching users:", error);
      toast.error(`Failed to fetch ${title}.`);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userRole]); // Re-fetch if the role prop ever changes

  // This function is called after a new user is created in the modal
  const handleUserAdded = () => {
    setIsModalOpen(false);
    toast.success(`${title.slice(0, -1)} created successfully!`);
    // This is the key fix: re-fetch the user list to show the new user
    fetchUsers();
  };

  // Function to activate or deactivate a user
  const toggleUserStatus = async (userToUpdate: User) => {
    const action = userToUpdate.is_active ? 'Deactivate' : 'Activate';
    if (window.confirm(`Are you sure you want to ${action} ${userToUpdate.full_name}?`)) {
        try {
            await apiClient.put(`/api/users/${userToUpdate.id}`, { is_active: !userToUpdate.is_active });
            toast.success(`User status updated for ${userToUpdate.full_name}`);
            fetchUsers(); // Refresh the list after updating status
        } catch (error) {
            toast.error('Failed to update user status.');
        }
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className='flex items-center space-x-3'>
            <UserCog className="h-6 w-6 text-gray-700" />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage {title}</h1>
                <p className="text-gray-600">Add, view, and manage accounts for your hospital.</p>
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
              <tr><td colSpan={4} className="text-center p-6 text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="text-center p-6 text-gray-500">No {title.toLowerCase()} found.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.full_name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.is_active ? 'active' : 'inactive'} type='user' /></td>
                  <td className="px-6 py-4 space-x-4">
                     <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`text-sm font-medium ${user.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                     </button>
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
        role={userRole.toLowerCase() as UserRole}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}