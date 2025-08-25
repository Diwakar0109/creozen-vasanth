import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex h-[calc(100vh-65px)]">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet /> {/* Child routes will render here */}
        </main>
      </div>
    </div>
  );
}