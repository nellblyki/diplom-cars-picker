import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'cars_picker_auth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null };
    const parsed = JSON.parse(raw);
    return { user: parsed.user || null };
  } catch {
    return { user: null };
  }
}

export function AuthProvider({ children }) {
  const [{ user }, setAuth] = useState(() => loadStoredAuth());

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
  }, [user]);

  const login = (nextUser) => {
    setAuth({ user: nextUser });
  };

  const logout = () => {
    setAuth({ user: null });
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}


