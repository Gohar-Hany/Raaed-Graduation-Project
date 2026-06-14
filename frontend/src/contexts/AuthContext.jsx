import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const MOCK_USERS = {
  admin: {
    id: 'admin-001',
    name: 'Dr. Sherif Salem',
    nameAr: 'د. شريف سالم',
    email: 'admin@raaed.edu',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin&backgroundColor=b6e3f4',
  },
  student: {
    id: 'student-001',
    name: 'Student',
    nameAr: 'طالب',
    email: 'student@raaed.edu',
    role: 'student',
    avatar: null,
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('raaed_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('raaed_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (role) => {
    const userData = MOCK_USERS[role];
    if (!userData) return false;
    setUser(userData);
    localStorage.setItem('raaed_user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('raaed_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
