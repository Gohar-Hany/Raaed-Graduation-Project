import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [hoveredRole, setHoveredRole] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    navigate(role === 'admin' ? '/admin' : '/student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 animate-slide-up">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow-lg mb-6">
            <Sparkles size={36} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-gradient mb-3 font-arabic">رائد</h1>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            AI Educational Platform
          </h2>
          <p className="text-surface-500 dark:text-surface-400 max-w-md mx-auto">
            Powered by advanced RAG and multi-agent AI systems to enhance your learning experience
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Admin Card */}
          <button
            onClick={() => handleLogin('admin')}
            onMouseEnter={() => setHoveredRole('admin')}
            onMouseLeave={() => setHoveredRole(null)}
            className={`group relative p-8 rounded-3xl border-2 text-left transition-all duration-500 cursor-pointer
              ${hoveredRole === 'admin'
                ? 'border-primary-500 bg-white dark:bg-surface-900 shadow-glow-lg scale-[1.03]'
                : 'border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 hover:border-primary-300 shadow-card hover:shadow-card-hover'
              }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 ${
              hoveredRole === 'admin'
                ? 'gradient-primary shadow-glow scale-110'
                : 'bg-primary-50 dark:bg-primary-950/50'
            }`}>
              <Shield size={26} className={`transition-colors ${hoveredRole === 'admin' ? 'text-white' : 'text-primary-500'}`} />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              Instructor / Admin
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 leading-relaxed">
              Manage courses, create tasks, upload materials, and monitor student interactions through the command center.
            </p>
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold text-sm group-hover:gap-3 transition-all">
              <span>Enter Dashboard</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Student Card */}
          <button
            onClick={() => handleLogin('student')}
            onMouseEnter={() => setHoveredRole('student')}
            onMouseLeave={() => setHoveredRole(null)}
            className={`group relative p-8 rounded-3xl border-2 text-left transition-all duration-500 cursor-pointer
              ${hoveredRole === 'student'
                ? 'border-accent-500 bg-white dark:bg-surface-900 shadow-glow-lg scale-[1.03]'
                : 'border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/80 hover:border-accent-300 shadow-card hover:shadow-card-hover'
              }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 ${
              hoveredRole === 'student'
                ? 'gradient-accent shadow-glow scale-110'
                : 'bg-accent-50 dark:bg-accent-950/50'
            }`}>
              <GraduationCap size={26} className={`transition-colors ${hoveredRole === 'student' ? 'text-white' : 'text-accent-500'}`} />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
              Student
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 leading-relaxed">
              Chat with the AI study assistant, take interactive quizzes, and explore course materials at your own pace.
            </p>
            <div className="flex items-center gap-2 text-accent-600 dark:text-accent-400 font-semibold text-sm group-hover:gap-3 transition-all">
              <span>Start Learning</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-surface-400 mt-10">
          Digital Pioneers Initiative • AI Learning Assistant v2.0
        </p>
      </div>
    </div>
  );
}
