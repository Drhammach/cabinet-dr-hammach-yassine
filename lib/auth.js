// lib/auth.js - VERSION CORRIGÉE
"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';

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
    try {
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
    } catch (err) {
      return { ok: false, error: "Erreur réseau" };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isDoctor: user?.role === 'medecin',
    isAssistante: user?.role === 'assistante'
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
