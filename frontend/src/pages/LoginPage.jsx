import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let result;
    if (isRegistering) {
      result = await register(name, email, password, "student");
    } else {
      result = await login(email, password);
    }
    
    setIsSubmitting(false);

    if (result && result.success) {
      toast.success(isRegistering ? "Registration successful!" : "Welcome back!");
      navigate(result.user.role === 'admin' ? '/admin' : '/student');
    } else {
      toast.error(result?.error || "Authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface-50 dark:bg-surface-950 px-4">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="bg-white/80 dark:bg-surface-900/80 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-surface-800 shadow-2xl p-8 sm:p-10 animate-slide-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src="/favicon.png" alt="Raaed Logo" className="w-24 h-24 object-contain drop-shadow-xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-gradient mb-2 font-arabic">رائد | Raaed</h1>
            <p className="text-surface-500 dark:text-surface-400 font-medium">
              {isRegistering ? 'Create your student account' : 'Welcome to Raaed'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-surface-700 dark:text-surface-300 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-50/50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 dark:text-surface-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@raaed.edu"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-50/50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-surface-700 dark:text-surface-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-50/50 dark:bg-surface-950/50 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full gradient-primary hover:opacity-90 text-white font-bold py-3.5 px-4 rounded-xl shadow-glow transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isRegistering ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-surface-500 dark:text-surface-400">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-primary-600 dark:text-primary-400 font-bold hover:underline"
              >
                {isRegistering ? 'Sign In' : 'Register now'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
