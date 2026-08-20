import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Calendar, Target, User, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchPatients } from '../services/patients';

export default function PatientList({ user, onNavigateToRegister, onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPatients(user?.email, user?.id);
        if (isMounted) setPatients(data || []);
      } catch (e) {
        console.error(e);
        if (isMounted) setError('Erro ao carregar lista de pacientes.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user]);

  const filteredPatients = patients.filter((p) => {
    if (!searchTerm.trim()) return true;
    return p.nome?.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sem consultas registradas';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Sem consultas registradas';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Sem consultas registradas';
    }
  };

  const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return null;
    try {
      const birth = new Date(birthDateStr);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? `${age} anos` : null;
    } catch {
      return null;
    }
  };

  const getPrimaryObjective = (patient) => {
    if (patient.objetivo_texto) return patient.objetivo_texto;
    if (Array.isArray(patient.objetivos) && patient.objetivos.length > 0) {
      return patient.objetivos.join(', ');
    }
    return 'Não informado';
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header section */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Listagem de Pacientes</h1>
          <p className="page-subtitle">
            Gerencie e acompanhe todos os pacientes cadastrados no seu consultório.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={onNavigateToRegister}
        >
          <UserPlus size={18} />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="list-controls-card">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar paciente pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        <div className="list-count-badge">
          <span>{filteredPatients.length} {filteredPatients.length === 1 ? 'paciente' : 'pacientes'}</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="loading-card">
          <div className="spinner-green"></div>
          <p>Carregando lista de pacientes...</p>
        </div>
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={24} color="#dc2626" />
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={() => {
            setLoading(true);
            setError(null);
            fetchPatients(user?.email, user?.id)
              .then((data) => setPatients(data || []))
              .catch(() => setError('Erro ao carregar lista de pacientes.'))
              .finally(() => setLoading(false));
          }}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      ) : filteredPatients.length === 0 ? (
        /* Empty State */
        <div className="empty-state-card">
          <div className="empty-icon-circle">
            <User size={36} />
          </div>
          <h3>Nenhum paciente cadastrado ainda</h3>
          <p>
            {searchTerm
              ? `Nenhum paciente encontrado para "${searchTerm}". Tente buscar por outro termo.`
              : 'Você ainda não possui pacientes cadastrados. Clique no botão abaixo para registrar o primeiro!'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              className="btn-primary-action"
              style={{ marginTop: '1rem' }}
              onClick={onNavigateToRegister}
            >
              <UserPlus size={18} />
              <span>Cadastrar Primeiro Paciente</span>
            </button>
          )}
        </div>
      ) : (
        /* Patient Grid / Cards */
        <div className="patient-grid">
          {filteredPatients.map((patient) => {
            const age = calculateAge(patient.data_nascimento);
            const objective = getPrimaryObjective(patient);
            const lastAppointment = formatDate(patient.data_ultima_consulta || patient.created_at);

            return (
              <div
                key={patient.id}
                className="patient-card"
                onClick={() => onSelectPatient(patient.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectPatient(patient.id)}
              >
                <div className="patient-card-header">
                  <div className="patient-avatar">
                    {patient.nome.trim()[0].toUpperCase()}
                  </div>
                  <div className="patient-card-info">
                    <h3 className="patient-name">{patient.nome}</h3>
                    <div className="patient-meta">
                      {age && <span className="meta-pill">{age}</span>}
                      {patient.sexo && <span className="meta-pill">{patient.sexo}</span>}
                    </div>
                  </div>
                  <ChevronRight size={20} className="card-arrow-icon" />
                </div>

                <div className="patient-card-body">
                  <div className="info-row">
                    <Target size={16} className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">Objetivo:</span>
                      <span className="info-value truncate">{objective}</span>
                    </div>
                  </div>

                  <div className="info-row">
                    <Calendar size={16} className="info-icon" />
                    <div className="info-text">
                      <span className="info-label">Última Consulta:</span>
                      <span className="info-value">{lastAppointment}</span>
                    </div>
                  </div>
                </div>

                <div className="patient-card-footer">
                  <span className="btn-view-profile">Ver perfil completo →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
