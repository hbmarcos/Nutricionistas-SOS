import React, { useState } from 'react';
import { LayoutDashboard, Users, UserPlus, LogOut, Menu, X, Leaf } from 'lucide-react';

export default function Sidebar({ user, currentView, onChangeView, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'N';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'patients-list', label: 'Meus Pacientes', icon: Users },
    { id: 'patient-register', label: 'Novo Paciente', icon: UserPlus },
  ];

  const handleNavClick = (id) => {
    onChangeView(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Toggle Header */}
      <div className="mobile-header">
        <div className="mobile-brand">
          <div className="sidebar-logo-icon">
            <Leaf size={18} color="#ffffff" />
          </div>
          <span className="mobile-brand-title">Nutri SOS</span>
        </div>
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay Backdrop for Mobile */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand Container */}
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">
            <Leaf size={22} color="#ffffff" />
          </div>
          <div className="sidebar-brand-text">
            <span className="brand-name">Nutricionistas</span>
            <span className="brand-badge">SOS</span>
          </div>
        </div>

        {/* User Info Card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.nome)}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name" title={user?.nome || 'Nutricionista'}>
              {user?.nome || 'Nutricionista'}
            </p>
            <p className="sidebar-user-email" title={user?.email}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-title">Menu Principal</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'patients-list' && currentView === 'patient-profile');
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={19} className="nav-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout-btn" onClick={onLogout}>
            <LogOut size={18} />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
}
