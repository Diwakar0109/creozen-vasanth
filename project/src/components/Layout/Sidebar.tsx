import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Calendar, FileText, Settings, Stethoscope, ShoppingBag, Shield, UserCheck,ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/index';
import { Building } from 'lucide-react'; // <-- Import Building icon


interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles: UserRole[];
}

// This list now contains ALL possible navigation items for ALL roles.
// The code below will filter this list to show only the items
// relevant to the currently logged-in user.
const allSidebarItems: SidebarItem[] = [

   // --- ADD SUPER_ADMIN LINKS ---
  { icon: Building, label: 'Manage Hospitals', path: '/super/hospitals', roles: ['super_admin'] },

  // Admin Links
  { icon: Home, label: 'Dashboard', path: '/admin/dashboard', roles: ['admin'] },
  { icon: Users, label: 'Manage Doctors', path: '/admin/manage-doctors', roles: ['admin'] },
  { icon: Users, label: 'Manage Nurses', path: '/admin/manage-nurses', roles: ['admin'] },
  { icon: ShoppingBag, label: 'Medical Shops', path: '/admin/manage-shops', roles: ['admin'] },
  { icon: Shield, label: 'Audit Logs', path: '/admin/audit', roles: ['admin'] }, // Assuming this will be built
  { icon: Settings, label: 'Settings', path: '/admin/settings', roles: ['admin'] }, // Assuming this will be built

  // Doctor Links
  { icon: Home, label: 'Dashboard', path: '/doctor/dashboard', roles: ['doctor'] },
  { icon: Users, label: 'Manage Patients', path: '/doctor/patients', roles: ['doctor'] },
  { icon: UserCheck, label: 'Manage Nurses', path: '/doctor/manage-nurses', roles: ['doctor'] },
  { icon: ShoppingBag, label: 'Medical Shops', path: '/doctor/manage-shops', roles: ['doctor'] },

  // Doctor might have more links later, e.g., '/doctor/patients'

  // Nurse Links
  { icon: Home, label: 'Dashboard', path: '/nurse/dashboard', roles: ['nurse'] },
  { icon: ClipboardList, label: 'All Patients Log', path: '/nurse/all-patients', roles: ['nurse'] },

  // Nurse might have more links later, e.g., '/nurse/patients'

  // Pharmacy Links
  { icon: Home, label: 'Dashboard', path: '/pharmacy/dashboard', roles: ['medical_shop'] },
  { icon: FileText, label: 'Prescription Queue', path: '/pharmacy/queue', roles: ['medical_shop'] },
];

export default function Sidebar() {
  const { currentRole } = useAuth();

  // Filter the master list to get only the items for the current user's role.
  const visibleItems = allSidebarItems.filter(item => 
    currentRole && item.roles.includes(currentRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto shrink-0">
      <nav className="p-4 space-y-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path} // Use the unique path as the key
            to={item.path}
            // 'end' is crucial for the Dashboard link to not stay active on other pages
            end={item.path.endsWith('/dashboard')} 
            className={({ isActive }) =>
              `w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}