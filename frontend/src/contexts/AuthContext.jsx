import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('raaed_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.user);
        } catch (err) {
          console.error("Token invalid", err);
          localStorage.removeItem('raaed_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = res;
      localStorage.setItem('raaed_token', access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.message || "Login failed" };
    }
  };

  const register = async (name, email, password, role = "student") => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { access_token, user: userData } = res;
      localStorage.setItem('raaed_token', access_token);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('raaed_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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
