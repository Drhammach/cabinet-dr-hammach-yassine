'use client';

import { useState, useEffect } from 'react';

export default function ArchivesManager() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/triage-forms', { credentials: 'include' });
      const data = await res.json();
      setRecords(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Archives Patients</h1>
      {loading ? <p>Chargement...</p> : (
        <div>
          {records.map(r => (
            <div key={r.id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
              <p><strong>{r.patient_name}</strong> - {r.main_symptom}</p>
              <p>Status: {r.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
