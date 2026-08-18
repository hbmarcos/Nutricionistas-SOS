import React from 'react';
import { LogOut, Users, Calendar, FileText } from 'lucide-react';
import Logo from './Logo';

export default function Dashboard({ user, onLogout }) {
  const getInitials = (name) => {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="auth-card dashboard-card animate-fade-in">
      <Logo subtitle="Painel de Controle do Nutricionista" />

      <div className="dashboard-header">
        <div className="user-badge">
          <div className="avatar">{getInitials(user.nome)}</div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary-900)' }}>
              {user.nome || 'Nutricionista'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        </div>

        <button type="button" className="btn-logout" onClick={onLogout}>
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>

      <div className="dashboard-body">
        <div className="welcome-box">
          <h3>Bem-vindo(a) ao Nutricionistas-SOS! 👋</h3>
          <p>
            Sua conta de nutricionista está ativa e sincronizada com o banco Neon. Você já pode cadastrar pacientes e planejar consultas.
          </p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-item">
            <Users size={20} style={{ color: 'var(--primary-600)', marginBottom: '0.25rem' }} />
            <div className="stat-value">0</div>
            <div className="stat-label">Pacientes</div>
          </div>
          <div className="stat-item">
            <Calendar size={20} style={{ color: 'var(--primary-600)', marginBottom: '0.25rem' }} />
            <div className="stat-value">0</div>
            <div className="stat-label">Consultas</div>
          </div>
          <div className="stat-item">
            <FileText size={20} style={{ color: 'var(--primary-600)', marginBottom: '0.25rem' }} />
            <div className="stat-value">0</div>
            <div className="stat-label">Planos</div>
          </div>
        </div>
      </div>
    </div>
  );
}
