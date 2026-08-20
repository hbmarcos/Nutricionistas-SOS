import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientRegister from './components/PatientRegister';
import PatientProfile from './components/PatientProfile';
import { getSession, signOut } from './services/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register' | 'dashboard' | 'patients-list' | 'patient-register' | 'patient-profile'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Verifica se já existe uma sessão ativa salva
    const session = getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      setCurrentView('dashboard');
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (user) => {
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    signOut();
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedPatientId(null);
  };

  const handleViewChange = (view, patientId = null) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setCurrentView(view);
  };

  if (initializing) {
    return (
      <div className="app-viewport">
        <div className="spinner" style={{ width: 32, height: 32, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#34d399' }}></div>
      </div>
    );
  }

  // If logged in, show app shell layout with fixed sidebar
  if (currentUser) {
    return (
      <div className="app-layout">
        <Sidebar
          user={currentUser}
          currentView={currentView}
          onChangeView={handleViewChange}
          onLogout={handleLogout}
        />
        <main className="main-content-area">
          {currentView === 'dashboard' && (
            <Dashboard user={currentUser} onChangeView={handleViewChange} />
          )}

          {currentView === 'patients-list' && (
            <PatientList
              user={currentUser}
              onNavigateToRegister={() => handleViewChange('patient-register')}
              onSelectPatient={(id) => handleViewChange('patient-profile', id)}
            />
          )}

          {currentView === 'patient-register' && (
            <PatientRegister
              user={currentUser}
              onRegisterSuccess={(newId) => handleViewChange('patient-profile', newId)}
              onCancel={() => handleViewChange('patients-list')}
            />
          )}

          {currentView === 'patient-profile' && (
            <PatientProfile
              patientId={selectedPatientId}
              onBackToList={() => handleViewChange('patients-list')}
            />
          )}
        </main>
      </div>
    );
  }

  // Auth screen layout (Login / Register)
  return (
    <div className="app-viewport">
      <div className="bg-decor bg-decor-1"></div>
      <div className="bg-decor bg-decor-2"></div>

      {currentView === 'register' ? (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      ) : (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      )}
    </div>
  );
}
