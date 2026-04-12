// components/ArchivesManager.js  ← .js pas .tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ArchivesManager() {
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [expandedRecord, setExpandedRecord] = useState(null);

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setDateFrom(lastMonth.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/data/patients', { credentials: 'include' });
      if (res.status === 401) {
        setError('Session expirée - reconnectez-vous');
        return;
      }
      const { data } = await res.json();
      setPatients(data || []);
    } catch (err) {
      setError('Erreur: ' + err.message);
    }
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (selectedPatient !== 'all') params.append('patientId', selectedPatient);
      if (dateFrom) params.append('from', dateFrom);
      if (dateTo) params.append('to', dateTo);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/data/patient-history?${params}`, {
        credentials: 'include'
      });

      if (res.status === 401) {
        setError('Session expirée');
        setLoading(false);
        return;
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur serveur');

      setHistory(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPatient, dateFrom, dateTo, statusFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '1.5rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Archives Médicales</h1>
              <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Historique des consultations</p>
            </div>
            
            <button
              onClick={fetchHistory}
              disabled={loading}
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#2563eb', 
                color: 'white', 
                borderRadius: '0.5rem',
                opacity: loading ? 0.5 : 1 
              }}
            >
              {loading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>

          {error && (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Patient</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              >
                <option value="all">Tous les patients</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Date début</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Date fin</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              >
                <option value="all">Tous</option>
                <option value="terminee">Terminée</option>
                <option value="en_attente">En attente</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: 500, opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Recherche...' : '🔍 Rechercher'}
          </button>
        </div>

        {history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map((record) => (
              <div key={record.id} style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div 
                  style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#f9fafb' }}
                  onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', background: '#dbeafe', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 'bold' }}>
                      {record.patients?.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, color: '#111827' }}>{record.patients?.full_name || 'Patient inconnu'}</h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{formatDate(record.created_at)}</p>
                    </div>
                  </div>
                  
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    background: record.status === 'terminee' ? '#dcfce7' : record.status === 'en_attente' ? '#fef9c3' : '#fee2e2',
                    color: record.status === 'terminee' ? '#166534' : record.status === 'en_attente' ? '#854d0e' : '#991b1b'
                  }}>
                    {record.status}
                  </span>
                </div>
                
                {expandedRecord === record.id && (
                  <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Motif</h4>
                        <p style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem' }}>{record.main_symptom}</p>
                      </div>
                      
                      <div>
                        <h4 style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Constantes</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                          {record.ta && <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>TA: {record.ta}</div>}
                          {record.temperature && <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>T°: {record.temperature}°C</div>}
                          {record.fc && <div style={{ background: '#f9fafb', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>FC: {record.fc}</div>}
                        </div>
                      </div>
                    </div>
                    
                    {record.doctor_notes && (
                      <div style={{ marginTop: '1rem' }}>
                        <h4 style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Notes médecin</h4>
                        <p style={{ background: '#fefce8', padding: '0.75rem', borderRadius: '0.5rem', fontStyle: 'italic' }}>{record.doctor_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Aucune consultation trouvée</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Utilisez les filtres pour rechercher</p>
          </div>
        )}
      </div>
    </div>
  );
}
