import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { getSession, signOut } from './services/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'register' | 'dashboard'
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
  };

  if (initializing) {
    return (
      <div className="app-viewport">
        <div className="spinner" style={{ width: 32, height: 32, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#34d399' }}></div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <div className="bg-decor bg-decor-1"></div>
      <div className="bg-decor bg-decor-2"></div>

      {currentView === 'dashboard' && currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      ) : currentView === 'register' ? (
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
