// app/debug/page.tsx
'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
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
    } catch (err: any) {
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
    } catch (err: any) {
      addLog(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const login = async (role: 'assistante' | 'medecin') => {
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
        addLog('✅ Connecté ! Testez les routes maintenant.');
      }
    } catch (err: any) {
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          🔴 DEBUG AUTHENTIFICATION
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button onClick={testAuth} disabled={loading} className="p-3 bg-blue-100 text-blue-700 rounded font-semibold">
            Test Auth
          </button>
          <button onClick={testPatients} disabled={loading} className="p-3 bg-green-100 text-green-700 rounded font-semibold">
            Test Patients
          </button>
          <button onClick={() => login('assistante')} disabled={loading} className="p-3 bg-yellow-100 text-yellow-700 rounded font-semibold">
            Login Assistante
          </button>
          <button onClick={() => login('medecin')} disabled={loading} className="p-3 bg-purple-100 text-purple-700 rounded font-semibold">
            Login Médecin
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={checkCookies} className="p-3 bg-gray-200 rounded font-semibold">
            🍪 Voir Cookies
          </button>
          <button onClick={logout} className="p-3 bg-red-100 text-red-700 rounded font-semibold">
            Logout
          </button>
        </div>

        <div className="bg-black text-green-400 font-mono p-4 rounded-lg h-80 overflow-auto text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">Cliquez sur les boutons pour tester...</p>
          ) : (
            logs.map((log, i) => <div key={i} className="mb-1 break-all">{log}</div>)
          )}
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-bold text-yellow-800">Instructions:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-yellow-700">
            <li>Cliquez sur "Login Assistante" ou "Login Médecin"</li>
            <li>Cliquez sur "Voir Cookies" pour vérifier auth-token</li>
            <li>Cliquez sur "Test Patients" pour vérifier les routes API</li>
            <li>Si 401 persiste, vérifiez les logs Vercel (Functions)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
