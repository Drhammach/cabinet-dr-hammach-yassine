/** @jsx React.createElement */
'use client';

import React, { useState } from 'react';

export default function DebugPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const testAuth = async () => {
    setLoading(true);
    addLog('🔍 Test /api/auth...');
    
    try {
      const res = await fetch('/api/auth', { 
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json();
      addLog(`📡 Status: ${res.status}`);
      addLog(`📄 Data: ${JSON.stringify(data)}`);
    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testPatients = async () => {
    setLoading(true);
    addLog('🔍 Test /api/data/patients...');
    
    try {
      const res = await fetch('/api/data/patients', { 
        credentials: 'include',
        cache: 'no-store'
      });
      const data = await res.json();
      addLog(`📡 Status: ${res.status}`);
      addLog(`📄 Data: ${JSON.stringify(data).substring(0, 300)}...`);
    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const login = async (role) => {
    setLoading(true);
    const pin = role === 'assistante' ? '1234' : '2026';
    addLog(`🔑 Login ${role} (PIN: ${pin})...`);
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, pin }),
        credentials: 'include'
      });
      const data = await res.json();
      addLog(`📡 Status: ${res.status}`);
      addLog(`📄 Data: ${JSON.stringify(data)}`);
      
      if (res.ok) {
        addLog('✅ Connecté !');
      }
    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE', credentials: 'include' });
    addLog('👋 Déconnecté');
  };

  const checkCookies = () => {
    addLog(`🍪 Cookies: ${document.cookie || 'AUCUN'}`);
  };

  return React.createElement('div', { style: { minHeight: '100vh', background: '#f3f4f6', padding: '2rem' } },
    React.createElement('div', { style: { maxWidth: '56rem', margin: '0 auto', background: 'white', borderRadius: '1rem', padding: '1.5rem' } },
      React.createElement('h1', { style: { fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' } }, '🔴 DEBUG AUTHENTIFICATION'),
      
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' } },
        React.createElement('button', { onClick: testAuth, disabled: loading, style: { padding: '0.75rem', background: '#dbeafe', borderRadius: '0.5rem' } }, 'Test Auth'),
        React.createElement('button', { onClick: testPatients, disabled: loading, style: { padding: '0.75rem', background: '#dcfce7', borderRadius: '0.5rem' } }, 'Test Patients'),
        React.createElement('button', { onClick: () => login('assistante'), disabled: loading, style: { padding: '0.75rem', background: '#fef9c3', borderRadius: '0.5rem' } }, 'Login Assistante'),
        React.createElement('button', { onClick: () => login('medecin'), disabled: loading, style: { padding: '0.75rem', background: '#f3e8ff', borderRadius: '0.5rem' } }, 'Login Médecin')
      ),

      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' } },
        React.createElement('button', { onClick: checkCookies, style: { padding: '0.75rem', background: '#e5e7eb', borderRadius: '0.5rem' } }, '🍪 Voir Cookies'),
        React.createElement('button', { onClick: logout, style: { padding: '0.75rem', background: '#fee2e2', borderRadius: '0.5rem' } }, 'Logout')
      ),

      React.createElement('div', { style: { background: 'black', color: '#4ade80', fontFamily: 'monospace', padding: '1rem', borderRadius: '0.5rem', height: '20rem', overflow: 'auto' } },
        logs.map((log, i) => React.createElement('div', { key: i }, log))
      )
    )
  );
}
