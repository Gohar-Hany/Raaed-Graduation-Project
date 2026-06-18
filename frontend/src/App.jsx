import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ToastProvider } from './components/Toast';

import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminChat from './pages/admin/AdminChat';
import AdminData from './pages/admin/AdminData';
import AdminUpload from './pages/admin/AdminUpload';
import AdminGuidelines from './pages/admin/AdminGuidelines';
import AdminStudents from './pages/admin/AdminStudents';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentChat from './pages/student/StudentChat';
import StudentQuiz from './pages/student/StudentQuiz';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-soft shadow-glow">
          <span className="text-white font-bold text-lg font-arabic">ر</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="data" element={<AdminData />} />
        <Route path="upload" element={<AdminUpload />} />
        <Route path="guidelines" element={<AdminGuidelines />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="chat" element={<StudentChat />} />
        <Route path="quiz" element={<StudentQuiz />} />
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
