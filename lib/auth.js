"use client";

import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Erreur vérification session:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (role, pin) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, pin })
    });

    const data = await res.json();
    
    if (res.ok) {
      setUser(data.user);
      return { ok: true };
    } else {
      return { ok: false, error: data.error };
    }
  };

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      isDoctor: user?.role === 'medecin',
      isAssistante: user?.role === 'assistante'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
