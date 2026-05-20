import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  rank?: number;
  rolePrefs?: string;
  region?: string;
  languages?: string;
  bio?: string;
  isLooking?: boolean;
  lookingExpiry?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onLogout = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:logout', onLogout);

    if (token) {
      api.users.me()
        .then(setUser)
        .catch(onLogout)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('auth:logout', onLogout);
  }, [token]);

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    if (token) {
      const u = await api.users.me();
      setUser(u);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
