// app/debug/page.js  ← .js pas .tsx
'use client';

import { useState } from 'react';

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

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
          🔴 DEBUG AUTHENTIFICATION
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={testAuth} disabled={loading} style={{ padding: '0.75rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Test Auth
          </button>
          <button onClick={testPatients} disabled={loading} style={{ padding: '0.75rem', background: '#dcfce7', color: '#15803d', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Test Patients
          </button>
          <button onClick={() => login('assistante')} disabled={loading} style={{ padding: '0.75rem', background: '#fef9c3', color: '#a16207', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Login Assistante
          </button>
          <button onClick={() => login('medecin')} disabled={loading} style={{ padding: '0.75rem', background: '#f3e8ff', color: '#7c3aed', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Login Médecin
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={checkCookies} style={{ padding: '0.75rem', background: '#e5e7eb', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            🍪 Voir Cookies
          </button>
          <button onClick={logout} style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>

        <div style={{ background: 'black', color: '#4ade80', fontFamily: 'monospace', padding: '1rem', borderRadius: '0.5rem', height: '20rem', overflow: 'auto', fontSize: '0.875rem' }}>
          {logs.length === 0 ? (
            <p style={{ color: '#6b7280' }}>Cliquez sur les boutons pour tester...</p>
          ) : (
            logs.map((log, i) => <div key={i} style={{ marginBottom: '0.25rem', wordBreak: 'break-all' }}>{log}</div>)
          )}
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fefce8', border: '1px solid #fde047', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <p style={{ fontWeight: 'bold', color: '#854d0e' }}>Instructions:</p>
          <ol style={{ listStyle: 'decimal', paddingLeft: '1.25rem', marginTop: '0.5rem', color: '#a16207' }}>
            <li>Cliquez sur "Login Assistante"</li>
            <li>Cliquez sur "Voir Cookies"</li>
            <li>Cliquez sur "Test Patients"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
