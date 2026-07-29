import { useState } from 'react';
import { api } from '../api/client';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('la7_auth') === 'true';
  });

  const login = async (pin) => {
    try {
      const res = await api.auth.loginPin(pin).catch((err) => {
        // Fallback local si backend no responde
        if (pin === '1234') {
          return { success: true };
        }
        throw err;
      });

      if (res && res.success) {
        localStorage.setItem('la7_auth', 'true');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Autenticación fallida:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('la7_auth');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    login,
    logout
  };
}

