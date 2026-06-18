import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSidebar } from '../contexts/SidebarContext';
import {
  LayoutDashboard, MessageSquare, Database, Upload, BookOpen,
  GraduationCap, BrainCircuit, LogOut, Sun, Moon, ChevronLeft,
  ChevronRight, Shield, Users
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Student Management' },
  { to: '/admin/chat', icon: MessageSquare, label: 'Command Chat' },
  { to: '/admin/data', icon: Database, label: 'Data Management' },
  { to: '/admin/upload', icon: Upload, label: 'Upload Files' },
  { to: '/admin/guidelines', icon: BookOpen, label: 'Guidelines' },
];

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/chat', icon: MessageSquare, label: 'Study Chat' },
  { to: '/student/quiz', icon: BrainCircuit, label: 'Take a Quiz' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { collapsed, toggle: toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? adminLinks : studentLinks;
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800`}
    >
      {/* Logo Area */}
      <div className={`flex items-center h-16 px-4 border-b border-surface-200 dark:border-surface-800 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-glow">
          {isAdmin ? (
            <Shield size={18} className="text-white" />
          ) : (
            <GraduationCap size={18} className="text-white" />
          )}
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-gradient leading-tight font-arabic">رائد</h1>
            <p className="text-[10px] text-surface-400 font-medium tracking-wide uppercase">
              {isAdmin ? 'Admin Panel' : 'Student Portal'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            title={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
              ${collapsed ? 'justify-center' : ''}
              ${isActive
                ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
              }`
            }
          >
            <link.icon size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!collapsed && <span className="animate-fade-in">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-800 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100
            ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Profile */}
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">{user.name}</p>
              <p className="text-xs text-surface-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            text-danger-500 hover:bg-danger-500/10
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors
            ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
