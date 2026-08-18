import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, CheckCircle2, UserPlus, Eye, EyeOff } from 'lucide-react';
import Logo from './Logo';
import { signUp } from '../services/auth';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPasswordValid = senha.length >= 9;
  const senhasIguais = senha && confirmarSenha && senha === confirmarSenha;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (senha.length < 9) {
      setError('A senha deve conter no mínimo 9 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const user = await signUp({ nome, email, senha });
      onRegisterSuccess(user);
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card animate-fade-in">
      <Logo subtitle="Crie sua conta profissional gratuitamente" />

      <h2 className="form-title">Cadastro de Nutricionista</h2>

      {error && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="reg-nome">Nome completo</label>
          <div className="input-wrapper">
            <User className="input-icon" size={17} />
            <input
              id="reg-nome"
              type="text"
              placeholder="Dra. Maria Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-email">E-mail profissional</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={17} />
            <input
              id="reg-email"
              type="email"
              placeholder="maria@nutri.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reg-senha">Senha</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={17} />
            <input
              id="reg-senha"
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="Mínimo 9 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
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
          {senha && (
            <div className={`password-hint ${isPasswordValid ? 'valid' : 'invalid'}`}>
              {isPasswordValid
                ? <><CheckCircle2 size={13} /><span>Senha com comprimento adequado</span></>
                : <><AlertCircle size={13} /><span>Mínimo de 9 caracteres ({9 - senha.length} restantes)</span></>
              }
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="reg-confirmar-senha">Confirmar senha</label>
          <div className="input-wrapper">
            <Lock className="input-icon" size={17} />
            <input
              id="reg-confirmar-senha"
              type={mostrarConfirmar ? 'text' : 'password'}
              placeholder="Repita sua senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              style={{ paddingRight: '3rem' }}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
              tabIndex={-1}
              aria-label={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmarSenha && (
            <div className={`password-hint ${senhasIguais ? 'valid' : 'invalid'}`}>
              {senhasIguais
                ? <><CheckCircle2 size={13} /><span>Senhas conferem</span></>
                : <><AlertCircle size={13} /><span>As senhas não coincidem</span></>
              }
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner"></span>
              <span>Criando conta...</span>
            </>
          ) : (
            <>
              <UserPlus size={18} />
              <span>Criar conta</span>
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <span>Já tem conta?</span>
        <button type="button" className="auth-footer-link" onClick={onSwitchToLogin}>
          Faça login
        </button>
      </div>
    </div>
  );
}
