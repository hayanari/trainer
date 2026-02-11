import { createContext, useContext, useState, useEffect } from 'react';
import { getSession, logoutUser } from '../data/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      setUser(session);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const login = (userData) => {
    setUser(userData);
  };

  const value = { user, loading, logout, login };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
