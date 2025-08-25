import { useState } from 'react';
import { Bell, Search, User, ChevronDown, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PatientSearchModal from '../common/PatientSearchModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const getRoleLabel = (roleType: string) => {
    return roleType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">HealthCare HMS</h1>
            <p className="text-sm text-gray-500">Central General Hospital</p>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-8">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full text-left pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 transition-colors relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            Search by phone or patient name...
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-400 hover:text-gray-500">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
          </button>

          <div className="relative">
            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center space-x-2 text-sm">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className='text-left'>
                <span className="font-medium text-gray-800">{user?.full_name}</span>
                <p className='text-xs text-gray-500'>{getRoleLabel(user?.role || '')}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button onClick={logout} className="w-full text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 px-4 py-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <PatientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );
}