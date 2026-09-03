import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Activity,
  Clock,
  ArrowLeft,
  AlertCircle,
  Scale,
  Plus,
  FileText,
  Save,
  CheckCircle2,
  MapPin
} from 'lucide-react';
import { fetchPatientById, updatePatient, fetchConsultas, fetchPlanosAlimentares } from '../services/patients';
import { getCountryByCity, COMMON_CITIES } from '../utils/locationData';
import { getCityImageUrl } from '../utils/cityImage';
import { getPatientPhoto } from '../utils/patientAvatar';
import WeightChart from './WeightChart';
import ConsultaModal from './ConsultaModal';
import MealPlanGenerator from './MealPlanGenerator';

// Helper para formatar data de nascimento para input date (YYYY-MM-DD)
function formatBirthDateForInput(val) {
  if (!val) return '';
  try {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    const s = String(val);
    return s.split('T')[0];
  } catch {
    return '';
  }
}

export default function PatientProfile({ patientId, onBackToList }) {
  // Main Sections: 'dados' | 'consultas' | 'planos'
  const [activeSection, setActiveSection] = useState('dados');

  // Sub-tabs for Section 1 (Dados do Paciente): 'pessoal' | 'clinico' | 'habitos'
  const [activeDataTab, setActiveDataTab] = useState('pessoal');

  // Data States
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [planos, setPlanos] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const currentCity = formData?.cidade || patient?.cidade;
  const currentPais = formData?.pais || patient?.pais;
  const cityImgUrl = getCityImageUrl(currentCity);

  useEffect(() => {
    const mainArea = document.querySelector('.main-content-area') || document.body;
    if (cityImgUrl) {
      mainArea.style.backgroundImage = `linear-gradient(rgba(2, 44, 34, 0.75), rgba(6, 78, 59, 0.85)), url(${cityImgUrl})`;
      mainArea.style.backgroundSize = 'cover';
      mainArea.style.backgroundPosition = 'center';
      mainArea.style.backgroundAttachment = 'fixed';
      mainArea.style.transition = 'background 0.5s ease-in-out';
    } else {
      mainArea.style.backgroundImage = '';
      mainArea.style.backgroundSize = '';
      mainArea.style.backgroundPosition = '';
      mainArea.style.backgroundAttachment = '';
    }

    return () => {
      mainArea.style.backgroundImage = '';
      mainArea.style.backgroundSize = '';
      mainArea.style.backgroundPosition = '';
      mainArea.style.backgroundAttachment = '';
    };
  }, [cityImgUrl]);

  useEffect(() => {
    let isMounted = true;
    async function loadAllData() {
      if (!patientId) {
        if (isMounted) {
          setLoading(false);
          setError('Nenhum paciente selecionado.');
        }
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [patientRes, consultasRes, planosRes] = await Promise.all([
          fetchPatientById(patientId),
          fetchConsultas(patientId),
          fetchPlanosAlimentares(patientId)
        ]);

        if (isMounted) {
          if (patientRes) {
            setPatient(patientRes);
            setFormData({
              nome: patientRes.nome || '',
              data_nascimento: formatBirthDateForInput(patientRes.data_nascimento),
              sexo: patientRes.sexo || 'Feminino',
              cidade: patientRes.cidade || '',
              pais: patientRes.pais || '',
              peso_inicial: patientRes.peso_inicial ? String(patientRes.peso_inicial) : '',
              altura: patientRes.altura ? String(patientRes.altura) : '',
              objetivos: Array.isArray(patientRes.objetivos) ? patientRes.objetivos : [],
              objetivo_texto: patientRes.objetivo_texto || '',
              nivel_atividade: patientRes.nivel_atividade || 'Levemente ativo',
              patologias: Array.isArray(patientRes.patologias) ? patientRes.patologias : [],
              restricoes_alimentares: Array.isArray(patientRes.restricoes_alimentares) ? patientRes.restricoes_alimentares : [],
              alergias: Array.isArray(patientRes.alergias) ? patientRes.alergias : [],
              medicamentos: patientRes.medicamentos || '',
              suplementos: patientRes.suplementos || '',
              refeicoes_por_dia: patientRes.refeicoes_por_dia ? String(patientRes.refeicoes_por_dia) : '4',
              horario_acorda: patientRes.horario_acorda || '',
              horario_dorme: patientRes.horario_dorme || '',
              litros_agua: patientRes.litros_agua ? String(patientRes.litros_agua) : '2',
              atividade_fisica: Boolean(patientRes.atividade_fisica),
              atividade_fisica_descricao: patientRes.atividade_fisica_descricao || '',
              observacoes: patientRes.observacoes || ''
            });
          } else {
            setError('Paciente não encontrado.');
          }

          setConsultas(consultasRes || []);
          setPlanos(planosRes || []);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setError('Erro ao carregar prontuário do paciente.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllData();
    return () => { isMounted = false; };
  }, [patientId]);

  const reloadPatientData = async () => {
    if (!patientId) return;
    try {
      const [patientRes, consultasRes, planosRes] = await Promise.all([
        fetchPatientById(patientId),
        fetchConsultas(patientId),
        fetchPlanosAlimentares(patientId)
      ]);
      if (patientRes) {
        setPatient(patientRes);
        setFormData((prev) => ({
          ...prev,
          nome: patientRes.nome || prev?.nome || '',
          peso_inicial: patientRes.peso_inicial ? String(patientRes.peso_inicial) : prev?.peso_inicial || ''
        }));
      }
      setConsultas(consultasRes || []);
      setPlanos(planosRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle saving edited patient fields
  const handleSavePatientEdits = async (e) => {
    if (e) e.preventDefault();
    setSuccessMsg('');
    setError(null);

    if (!formData || !formData.nome || !formData.nome.trim()) {
      setError('O nome completo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePatient(patientId, formData);
      setPatient(updated);
      setSuccessMsg('Alterações salvas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Helper calculation for Age
  const calculateAge = (birthDateVal) => {
    if (!birthDateVal) return null;
    try {
      const birth = birthDateVal instanceof Date ? birthDateVal : new Date(birthDateVal);
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

  // Helper calculation for IMC
  const getIMCDetails = (peso, altura) => {
    const p = parseFloat(peso);
    const a = parseFloat(altura);
    if (!p || !a || p <= 0 || a <= 0) return null;

    const alturaM = a / 100;
    const imc = p / (alturaM * alturaM);
    const val = imc.toFixed(1);

    let label = '';
    let colorClass = '';

    if (imc < 18.5) {
      label = 'Abaixo do peso';
      colorClass = 'badge-warning';
    } else if (imc < 25.0) {
      label = 'Peso normal (Eutrofia)';
      colorClass = 'badge-success';
    } else if (imc < 30.0) {
      label = 'Sobrepeso';
      colorClass = 'badge-warning';
    } else if (imc < 35.0) {
      label = 'Obesidade I';
      colorClass = 'badge-danger';
    } else if (imc < 40.0) {
      label = 'Obesidade II';
      colorClass = 'badge-danger';
    } else {
      label = 'Obesidade III';
      colorClass = 'badge-danger';
    }

    return { val, label, colorClass };
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'Não informado';
    try {
      const date =
        dateVal instanceof Date
          ? dateVal
          : new Date(typeof dateVal === 'string' && !dateVal.includes('T') ? `${dateVal}T00:00:00` : dateVal);
      if (isNaN(date.getTime())) return typeof dateVal === 'string' ? dateVal : 'Não informado';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return typeof dateVal === 'string' ? dateVal : 'Não informado';
    }
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="loading-card">
          <div className="spinner-green"></div>
          <p>Carregando prontuário do paciente...</p>
        </div>
      </div>
    );
  }

  if (error || !patient || !formData) {
    return (
      <div className="page-container animate-fade-in">
        <button type="button" className="btn-back-link" onClick={onBackToList}>
          ← Voltar para a Lista de Pacientes
        </button>
        <div className="error-card">
          <AlertCircle size={24} color="#dc2626" />
          <p>{error || 'Paciente não encontrado.'}</p>
          <button type="button" className="btn-secondary" onClick={onBackToList}>
            Voltar para Pacientes
          </button>
        </div>
      </div>
    );
  }

  const handleCityChange = (cidadeVal) => {
    const associatedCountry = getCountryByCity(cidadeVal);
    setFormData((prev) => ({
      ...prev,
      cidade: cidadeVal,
      pais: associatedCountry || prev.pais || 'Brasil'
    }));
  };

  const age = calculateAge(formData?.data_nascimento || patient?.data_nascimento);
  const imcData = getIMCDetails(formData?.peso_inicial || patient?.peso_inicial, formData?.altura || patient?.altura);
  const avatarLetter = (formData?.nome || patient?.nome || 'P').trim()[0]?.toUpperCase() || 'P';
  const patientPhoto = getPatientPhoto(formData?.nome || patient?.nome, formData?.foto_url || patient?.foto_url);

  // Evita duplicar a exibição do país se a cidade já contiver a string do país
  const showCountryPill = currentPais && currentCity && !currentCity.toLowerCase().includes(currentPais.toLowerCase());

  return (
    <div className="page-container animate-fade-in">
      {/* Top Bar Back Link */}
      <div className="profile-top-bar">
        <button type="button" className="btn-back-link" onClick={onBackToList}>
          <ArrowLeft size={16} /> Voltar para a Lista de Pacientes
        </button>
      </div>

      {/* Patient Header Card */}
      <div className="patient-hero-card">
        <div className="hero-avatar">{avatarLetter}</div>
        <div className="hero-details">
          <div className="hero-name-row">
            <h1 className="hero-name">{patient.nome}</h1>
            {patient.sexo && <span className="meta-pill">{patient.sexo}</span>}
            {age && <span className="meta-pill">{age}</span>}
          </div>

          <div className="hero-contact-row">
            {currentCity && (
              <span className="contact-item">
                <MapPin size={14} /> {currentCity}
                {showCountryPill ? ` (${currentPais})` : ''}
              </span>
            )}
            <span className="contact-item">
              <Calendar size={14} /> Última consulta: {formatDate(patient.data_ultima_consulta)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Section Navigation Tabs (3 Sections) */}
      <div className="profile-main-tabs">
        <button
          type="button"
          className={`main-tab-btn ${activeSection === 'dados' ? 'active' : ''}`}
          onClick={() => setActiveSection('dados')}
        >
          <User size={18} />
          <span>1. Dados do Paciente</span>
        </button>

        <button
          type="button"
          className={`main-tab-btn ${activeSection === 'consultas' ? 'active' : ''}`}
          onClick={() => setActiveSection('consultas')}
        >
          <Activity size={18} />
          <span>2. Consultas</span>
          <span className="count-badge">{consultas.length}</span>
        </button>

        <button
          type="button"
          className={`main-tab-btn ${activeSection === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveSection('planos')}
        >
          <FileText size={18} />
          <span>3. Planos Alimentares</span>
          <span className="count-badge">{planos.length}</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="success-alert animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="error-alert animate-shake">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: DADOS DO PACIENTE (Editable 3-tab form) */}
      {activeSection === 'dados' && (
        <div className="profile-section-card animate-fade-in">
          {/* Sub-tabs header */}
          <div className="subtabs-header">
            <button
              type="button"
              className={`subtab-btn ${activeDataTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveDataTab('pessoal')}
            >
              <User size={16} /> Dados Pessoais
            </button>
            <button
              type="button"
              className={`subtab-btn ${activeDataTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveDataTab('clinico')}
            >
              <Activity size={16} /> Avaliação Clínica
            </button>
            <button
              type="button"
              className={`subtab-btn ${activeDataTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveDataTab('habitos')}
            >
              <Clock size={16} /> Hábitos e Rotina
            </button>
          </div>

          <form onSubmit={handleSavePatientEdits} className="subtab-form-content">
            {/* SUB-TAB 1: PESSOAL */}
            {activeDataTab === 'pessoal' && (
              <div className="form-grid animate-fade-in">
                <div className="form-group full-width">
                  <label className="required-label">Nome completo</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        nome: val
                      }));
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data de nascimento</label>
                  <div className="input-with-calc">
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    />
                    {age && <span className="calc-badge">{age}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    list="city-options-profile-list"
                    placeholder="Ex: São Paulo - SP ou Lisboa"
                    value={formData.cidade}
                    onChange={(e) => handleCityChange(e.target.value)}
                  />
                  <datalist id="city-options-profile-list">
                    {COMMON_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>País de origem (associado)</label>
                  <input
                    type="text"
                    placeholder="Ex: Brasil"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 2: CLÍNICO */}
            {activeDataTab === 'clinico' && (
              <div className="form-grid animate-fade-in">
                <div className="form-group">
                  <label>Peso atual (kg)</label>
                  <div className="unit-input-wrapper">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.peso_inicial}
                      onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                    />
                    <span className="unit-suffix">kg</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Altura (cm)</label>
                  <div className="unit-input-wrapper">
                    <input
                      type="number"
                      value={formData.altura}
                      onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    />
                    <span className="unit-suffix">cm</span>
                  </div>
                </div>

                {/* IMC Display */}
                <div className="form-group full-width">
                  <label>IMC (Calculado)</label>
                  <div className="imc-display-box">
                    {imcData ? (
                      <div className="imc-result">
                        <span className="imc-number">{imcData.val} kg/m²</span>
                        <span className={`imc-badge ${imcData.colorClass}`}>{imcData.label}</span>
                      </div>
                    ) : (
                      <span className="imc-placeholder">Informe peso e altura para calcular o IMC.</span>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Objetivo principal / observação de objetivo</label>
                  <input
                    type="text"
                    placeholder="Ex: Emagrecer e ganhar massa magra..."
                    value={formData.objetivo_texto}
                    onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Nível de atividade física</label>
                  <select
                    value={formData.nivel_atividade}
                    onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                  >
                    <option value="Sedentário">Sedentário (pouco ou nenhum exercício)</option>
                    <option value="Levemente ativo">Levemente ativo (exercício leve 1-3 dias/sem)</option>
                    <option value="Moderadamente ativo">Moderadamente ativo (exercício 3-5 dias/sem)</option>
                    <option value="Muito ativo">Muito ativo (exercício pesado 6-7 dias/sem)</option>
                    <option value="Extremamente ativo">Extremamente ativo (exercício muito pesado ou atleta)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Medicamentos contínuos</label>
                  <textarea
                    rows="2"
                    value={formData.medicamentos}
                    onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Suplementos em uso</label>
                  <textarea
                    rows="2"
                    value={formData.suplementos}
                    onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* SUB-TAB 3: HÁBITOS */}
            {activeDataTab === 'habitos' && (
              <div className="form-grid animate-fade-in">
                <div className="form-group">
                  <label>Refeições por dia</label>
                  <input
                    type="number"
                    value={formData.refeicoes_por_dia}
                    onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Água por dia (litros)</label>
                  <div className="unit-input-wrapper">
                    <input
                      type="number"
                      step="0.5"
                      value={formData.litros_agua}
                      onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                    />
                    <span className="unit-suffix">litros</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Horário que acorda</label>
                  <input
                    type="text"
                    value={formData.horario_acorda}
                    onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Horário que dorme</label>
                  <input
                    type="text"
                    value={formData.horario_dorme}
                    onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Pratica atividade física?</label>
                  <div className="radio-toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${formData.atividade_fisica ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, atividade_fisica: true })}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!formData.atividade_fisica ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, atividade_fisica: false, atividade_fisica_descricao: '' })}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {formData.atividade_fisica && (
                  <div className="form-group full-width">
                    <label>Qual atividade e frequência semanal?</label>
                    <input
                      type="text"
                      value={formData.atividade_fisica_descricao}
                      onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group full-width">
                  <label>Observações gerais</label>
                  <textarea
                    rows="3"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Save Changes Footer Button */}
            <div className="subtab-form-footer">
              <button type="submit" className="btn-primary-action btn-save-action" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner-sm"></span> Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Salvar alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 2: CONSULTAS (Evolution Chart + Consultation Modal & History) */}
      {activeSection === 'consultas' && (
        <div className="consultas-section animate-fade-in">
          {/* Top Bar with New Consultation Button */}
          <div className="section-toolbar">
            <h2 className="section-title">Histórico de Consultas & Evolução</h2>
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={18} />
              <span>Nova Consulta</span>
            </button>
          </div>

          {/* Weight Evolution Graph (Always visible) */}
          <WeightChart consultas={consultas} />

          {/* Consultation Cards List (Reverse Chronological) */}
          <div className="consultas-list-card">
            <h3 className="consultas-list-title">Consultas Realizadas ({consultas.length})</h3>

            {consultas.length === 0 ? (
              <div className="empty-dash-list" style={{ padding: '2rem' }}>
                <p>Nenhuma consulta registrada para este paciente.</p>
                <button
                  type="button"
                  className="btn-secondary mt-2"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus size={16} /> Cadastrar primeira consulta
                </button>
              </div>
            ) : (
              <div className="consultas-grid">
                {consultas.map((c) => (
                  <div key={c.id} className="consulta-card">
                    <div className="consulta-card-header">
                      <div className="consulta-date-badge">
                        <Calendar size={16} />
                        <span>{formatDate(c.data_consulta)}</span>
                      </div>
                      <div className="consulta-weight-pill">
                        <Scale size={16} />
                        <span>{c.peso} kg</span>
                      </div>
                    </div>

                    <div className="consulta-card-body">
                      <div className="consulta-metrics-row">
                        {c.cintura && (
                          <div className="c-metric">
                            <span className="c-label">Cintura:</span>
                            <span className="c-val">{c.cintura} cm</span>
                          </div>
                        )}
                        {c.quadril && (
                          <div className="c-metric">
                            <span className="c-label">Quadril:</span>
                            <span className="c-val">{c.quadril} cm</span>
                          </div>
                        )}
                        {c.percentual_gordura && (
                          <div className="c-metric">
                            <span className="c-label">% Gordura:</span>
                            <span className="c-val">{c.percentual_gordura}%</span>
                          </div>
                        )}
                      </div>

                      {c.observacoes && (
                        <div className="consulta-notes">
                          <span className="notes-label">Observações:</span>
                          <p>{c.observacoes}</p>
                        </div>
                      )}

                      {c.proximo_retorno && (
                        <div className="consulta-return-date">
                          <span className="return-label">Próximo retorno agendado:</span>
                          <span className="return-val">{formatDate(c.proximo_retorno)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: PLANOS ALIMENTARES */}
      {activeSection === 'planos' && (
        <div className="planos-section animate-fade-in">
          <MealPlanGenerator
            patient={patient}
            plans={planos}
            onPlanSaved={reloadPatientData}
          />
        </div>
      )}

      {/* Modal Nova Consulta */}
      {modalOpen && (
        <ConsultaModal
          patientId={patientId}
          patientName={patient?.nome}
          patientPhoto={patientPhoto}
          onClose={() => setModalOpen(false)}
          onConsultaCreated={() => {
            reloadPatientData();
          }}
        />
      )}
    </div>
  );
}
