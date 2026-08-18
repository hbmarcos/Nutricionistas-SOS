import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import Logo from './Logo';
import { signIn } from '../services/auth';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !senha) {
      setError('Preencha todos os campos para continuar.');
      return;
    }

    setLoading(true);
    try {
      const user = await signIn({ email, senha });
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Falha ao realizar login. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card animate-fade-in">
      <Logo subtitle="Gestão inteligente e simplificada para nutricionistas" />

      <h2 className="form-title">Acesse sua conta</h2>

      {error && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="login-email">E-mail profissional</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={17} />
            <input
              id="login-email"
              type="email"
              placeholder="seuemail@nutri.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-senha">Senha</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={17} />
            <input
              id="login-senha"
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Sua senha de acesso"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              tabIndex={-1}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <LogIn size={18} />
              <span>Entrar</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>Não tem conta?</span>
        <button type="button" className="auth-footer-link" onClick={onSwitchToRegister}>
          Cadastre-se
        </button>
      </div>
    </div>
  );
}
