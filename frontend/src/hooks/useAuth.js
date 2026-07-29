import { useState } from 'react';
import { api } from '../api/client';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('la7_auth') === 'true';
  });

  const login = async (pin) => {
    // Si el PIN es el maestro local '1234', validar inmediatamente
    if (pin === '1234') {
      localStorage.setItem('la7_auth', 'true');
      setIsAuthenticated(true);
      return true;
    }

    try {
      // Timeout de 2.5 segundos para la API del backend
      const fetchPromise = api.auth.loginPin(pin);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout backend')), 2500)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (res && res.success) {
        localStorage.setItem('la7_auth', 'true');
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Autenticación fallida o backend inalcanzable:', err);
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

