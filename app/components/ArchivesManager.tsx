// app/components/ArchivesManager.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Search, Calendar, Download, FileText, User, Activity,
  Printer, Filter, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';

interface Patient {
  id: string;
  full_name: string;
  phone: string;
  age?: number;
  sex?: string;
}

interface Consultation {
  id: string;
  created_at: string;
  main_symptom: string;
  diagnoses?: any[];
  status: string;
  priority: string;
  ta?: string;
  fc?: string;
  temperature?: string;
  spo2?: string;
  notes?: string;
  doctor_notes?: string;
  patients?: Patient;
  patient_age?: number;
  resume_clinique?: string;
  seen_by_doctor_at?: string;
}

export default function ArchivesManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    setDateFrom(format(lastMonth, 'yyyy-MM-dd'));
    setDateTo(format(today, 'yyyy-MM-dd'));
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
    } catch (err: any) {
      setError('Erreur chargement patients: ' + err.message);
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
        setError('Session expirée - reconnectez-vous');
        setLoading(false);
        return;
      }

      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Erreur serveur');

      setHistory(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedPatient, dateFrom, dateTo, statusFilter]);

  const exportToCSV = () => {
    const headers = ['Date', 'Patient', 'Téléphone', 'Âge', 'Motif', 'Diagnostic', 'Status', 'Constantes'];
    const rows = history.map(h => [
      format(parseISO(h.created_at), 'dd/MM/yyyy HH:mm'),
      h.patients?.full_name || '-',
      h.patients?.phone || '-',
      h.patient_age || '-',
      h.main_symptom,
      (h.diagnoses || []).map((d: any) => d.label).join(', ') || '-',
      h.status,
      h.resume_clinique
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archives-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'terminee': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'annulee': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Archives Médicales
              </h1>
              <p className="text-gray-600 mt-1">Historique des consultations et dossiers patients</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchHistory}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Chargement...' : 'Actualiser'}
              </button>
              
              <button
                onClick={exportToCSV}
                disabled={history.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Tous les patients</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Tous</option>
                <option value="terminee">Terminée</option>
                <option value="en_attente">En attente</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Recherche en cours...' : '🔍 Rechercher dans les archives'}
          </button>
        </div>

        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((record) => (
              <div 
                key={record.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {record.patients?.full_name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{record.patients?.full_name || 'Patient inconnu'}</h3>
                      <p className="text-sm text-gray-600">
                        {format(parseISO(record.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                    {expandedRecord === record.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
                
                {expandedRecord === record.id && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Motif</h4>
                        <p className="bg-gray-50 p-3 rounded">{record.main_symptom}</p>
                        
                        <h4 className="font-semibold text-gray-700 mt-4 mb-2">Diagnostics</h4>
                        <div className="bg-blue-50 p-3 rounded">
                          {(record.diagnoses || []).map((d: any, i: number) => (
                            <div key={i} className="text-sm">• {d.label} (score: {d.score})</div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Constantes</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {record.ta && <div className="bg-gray-50 p-2 rounded">TA: {record.ta}</div>}
                          {record.temperature && <div className="bg-gray-50 p-2 rounded">T°: {record.temperature}°C</div>}
                          {record.fc && <div className="bg-gray-50 p-2 rounded">FC: {record.fc}</div>}
                          {record.spo2 && <div className="bg-gray-50 p-2 rounded">SpO2: {record.spo2}%</div>}
                        </div>
                        
                        {record.doctor_notes && (
                          <>
                            <h4 className="font-semibold text-gray-700 mt-4 mb-2">Notes médecin</h4>
                            <p className="bg-yellow-50 p-3 rounded text-sm italic">{record.doctor_notes}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Aucune consultation trouvée</p>
            <p className="text-sm">Utilisez les filtres pour rechercher</p>
          </div>
        )}
      </div>
    </div>
  );
}
