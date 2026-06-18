import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

export default function DashboardLayout() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      {/* Main content area — offset for sidebar */}
      <main
        className={`min-h-screen transition-all duration-300 ease-out ${
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
