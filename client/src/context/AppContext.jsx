import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { verifyUser } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Authentication states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authLoading, setAuthLoading] = useState(!!localStorage.getItem('token'));

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m - 2, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(y, m, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  // Auth actions
  const login = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    triggerRefresh();
  }, [triggerRefresh]);

  const register = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    triggerRefresh();
  }, [triggerRefresh]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    triggerRefresh();
  }, [triggerRefresh]);

  // Load and verify user on mount or token change
  useEffect(() => {
    if (token) {
      setAuthLoading(true);
      verifyUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch((err) => {
          console.error('Session verification failed:', err);
          // Token is invalid/expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, [token]);

  return (
    <AppContext.Provider value={{
      selectedMonth, setSelectedMonth,
      refreshKey, triggerRefresh,
      goToPrevMonth, goToNextMonth,
      user, token, authLoading,
      login, register, logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
