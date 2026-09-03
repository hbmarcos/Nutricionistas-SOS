import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, UserPlus, ArrowRight } from 'lucide-react';
import { fetchPatients, fetchDashboardStats } from '../services/patients';

export default function Dashboard({ user, onChangeView }) {
  const [patientCount, setPatientCount] = useState(0);
  const [consultaCount, setConsultaCount] = useState(0);
  const [planoCount, setPlanoCount] = useState(0);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [patients, stats] = await Promise.all([
          fetchPatients(user?.email, user?.id),
          fetchDashboardStats(user?.email)
        ]);
        setPatientCount(stats?.patientCount ?? (patients ? patients.length : 0));
        setConsultaCount(stats?.consultaCount ?? 0);
        setPlanoCount(stats?.planoCount ?? 0);
        setRecentPatients(patients ? patients.slice(0, 3) : []);
      } catch (e) {
        console.error('Erro ao carregar estatísticas:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  return (
    <div className="page-container animate-fade-in">
      {/* Header section */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Painel de Controle</h1>
          <p className="page-subtitle">
            Olá, <strong>{user?.nome || 'Nutricionista'}</strong>! Acompanhe o resumo do seu consultório.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-action"
          onClick={() => onChangeView('patient-register')}
        >
          <UserPlus size={18} />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-banner-content">
          <h3>Bem-vindo(a) ao Nutricionistas-SOS! 👋</h3>
          <p>
            Sua conta de nutricionista está ativa e sincronizada com o banco Neon DB. Cadastre pacientes, monte relatórios clínicos e organize suas consultas.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="dashboard-stats-grid">
        <div
          className="stat-card clickable"
          onClick={() => onChangeView('patients-list')}
        >
          <div className="stat-icon-wrapper primary">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{loading ? '...' : patientCount}</span>
            <span className="stat-title">Pacientes Cadastrados</span>
          </div>
          <ArrowRight size={18} className="stat-arrow" />
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper info">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{loading ? '...' : consultaCount}</span>
            <span className="stat-title">Consultas Realizadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{loading ? '...' : planoCount}</span>
            <span className="stat-title">Planos Alimentares</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Patients */}
      <div className="dashboard-sections-grid">
        {/* Quick Actions Card */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Ações Rápidas</h3>
          </div>
          <div className="dash-card-body actions-list">
            <button
              type="button"
              className="quick-action-btn"
              onClick={() => onChangeView('patient-register')}
            >
              <div className="action-icon-circle">
                <UserPlus size={20} />
              </div>
              <div className="action-text">
                <strong>Cadastrar Paciente</strong>
                <span>Registrar ficha pessoal, clínica e hábitos</span>
              </div>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="quick-action-btn"
              onClick={() => onChangeView('patients-list')}
            >
              <div className="action-icon-circle">
                <Users size={20} />
              </div>
              <div className="action-text">
                <strong>Ver Lista de Pacientes</strong>
                <span>Buscar, filtrar e visualizar prontuários</span>
              </div>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Recent Patients List Card */}
        <div className="dash-card">
          <div className="dash-card-header flex-between">
            <h3>Pacientes Recentes</h3>
            {(patientCount > 0 || recentPatients.length > 0) && (
              <button
                type="button"
                className="btn-text-link"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof onChangeView === 'function') {
                    onChangeView('patients-list');
                  }
                }}
              >
                Ver todos ({patientCount || recentPatients.length})
              </button>
            )}
          </div>
          <div className="dash-card-body">
            {recentPatients.length === 0 ? (
              <div className="empty-dash-list">
                <p>Nenhum paciente cadastrado ainda.</p>
                <button
                  type="button"
                  className="btn-secondary mt-2"
                  onClick={() => onChangeView('patient-register')}
                >
                  <UserPlus size={16} /> Cadastrar primeiro paciente
                </button>
              </div>
            ) : (
              <div className="recent-patients-list">
                {recentPatients.map((p) => {
                  const initial = (p.nome || 'P').trim()[0]?.toUpperCase() || 'P';
                  return (
                    <div
                      key={p.id}
                      className="recent-patient-item"
                      onClick={() => onChangeView('patient-profile', p.id)}
                    >
                      <div className="avatar-sm">{initial}</div>
                      <div className="recent-info">
                        <span className="recent-name">{p.nome}</span>
                        <span className="recent-sub">
                          {p.sexo || 'Paciente'} • {p.objetivo_texto || (Array.isArray(p.objetivos) && p.objetivos[0]) || 'Geral'}
                        </span>
                      </div>
                      <ArrowRight size={16} className="recent-arrow" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
