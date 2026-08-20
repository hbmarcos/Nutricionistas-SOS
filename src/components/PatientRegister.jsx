import React, { useState } from 'react';
import { User, Activity, Clock, CheckCircle2, ArrowRight, ArrowLeft, Save, AlertCircle, Plus, X } from 'lucide-react';
import { createPatient } from '../services/patients';

export default function PatientRegister({ user, onRegisterSuccess, onCancel }) {
  const [activeTab, setActiveTab] = useState('pessoal'); // 'pessoal' | 'clinico' | 'habitos'
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Aba 1 - Pessoal
    nome: '',
    data_nascimento: '',
    sexo: 'Feminino',
    telefone: '',
    whatsapp: '',
    email: '',

    // Aba 2 - Clínico
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: 'Levemente ativo',
    patologias: [],
    patologia_custom: '',
    restricoes_alimentares: [],
    restricao_custom: '',
    alergias: [],
    alergia_custom: '',
    medicamentos: '',
    suplementos: '',

    // Aba 3 - Hábitos
    refeicoes_por_dia: '4',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '2',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: ''
  });

  // Phone masking function
  const formatPhone = (value) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  // Time formatting (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00, 2230 -> 22:30)
  const formatTime = (val) => {
    if (!val) return '';
    // If already in HH:MM format
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';

    if (digits.length === 1) return `0${digits}:00`;
    if (digits.length === 2) {
      const num = parseInt(digits, 10);
      if (num < 24) return `${digits.padStart(2, '0')}:00`;
      return `0${digits[0]}:0${digits[1]}`;
    }
    if (digits.length === 3) {
      const h = digits.slice(0, 1).padStart(2, '0');
      const m = digits.slice(1, 3);
      return `${h}:${m}`;
    }
    if (digits.length === 4) {
      const h = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      return `${h}:${m}`;
    }
    return val;
  };

  const handleTimeBlur = (field) => {
    const rawVal = formData[field];
    if (rawVal) {
      const formatted = formatTime(rawVal);
      setFormData((prev) => ({ ...prev, [field]: formatted }));
    }
  };

  // Calculate age from birth date
  const getCalculatedAge = () => {
    if (!formData.data_nascimento) return null;
    try {
      const birth = new Date(formData.data_nascimento);
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

  // Calculate IMC
  const getIMCDetails = () => {
    const p = parseFloat(formData.peso_inicial);
    const a = parseFloat(formData.altura);
    if (!p || !a || p <= 0 || a <= 0) return null;

    const alturaM = a / 100;
    const imc = p / (alturaM * alturaM);
    const imcFormatted = imc.toFixed(1);

    let classification = '';
    let colorClass = '';

    if (imc < 18.5) {
      classification = 'Abaixo do peso';
      colorClass = 'badge-warning';
    } else if (imc < 25.0) {
      classification = 'Peso normal (Eutrofia)';
      colorClass = 'badge-success';
    } else if (imc < 30.0) {
      classification = 'Sobrepeso';
      colorClass = 'badge-warning';
    } else if (imc < 35.0) {
      classification = 'Obesidade Grau I';
      colorClass = 'badge-danger';
    } else if (imc < 40.0) {
      classification = 'Obesidade Grau II';
      colorClass = 'badge-danger';
    } else {
      classification = 'Obesidade Grau III';
      colorClass = 'badge-danger';
    }

    return { val: imcFormatted, label: classification, colorClass };
  };

  // Handle Multi-choice array toggles (Patologias, Restrições, Alergias, Objetivos)
  const handleToggleArray = (field, optionValue) => {
    setFormData((prev) => {
      let currentList = [...(prev[field] || [])];
      if (optionValue === 'Nenhum') {
        return { ...prev, [field]: ['Nenhum'] };
      }
      // Remove 'Nenhum' if selecting another option
      currentList = currentList.filter((item) => item !== 'Nenhum');

      if (currentList.includes(optionValue)) {
        currentList = currentList.filter((item) => item !== optionValue);
      } else {
        currentList.push(optionValue);
      }
      return { ...prev, [field]: currentList };
    });
  };

  const handleAddCustomTag = (field, customInputKey) => {
    const val = formData[customInputKey]?.trim();
    if (!val) return;
    setFormData((prev) => {
      let currentList = (prev[field] || []).filter((item) => item !== 'Nenhum');
      if (!currentList.includes(val)) {
        currentList.push(val);
      }
      return { ...prev, [field]: currentList, [customInputKey]: '' };
    });
  };

  const handleRemoveTag = (field, tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((item) => item !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.nome.trim()) {
      setActiveTab('pessoal');
      setErrorMsg('O nome completo do paciente é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      const created = await createPatient(formData, user?.email, user?.nome);
      setSuccessMsg('Paciente cadastrado com sucesso!');
      setTimeout(() => {
        if (onRegisterSuccess && created?.id) {
          onRegisterSuccess(created.id);
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao cadastrar paciente. Tente novamente.');
      setSaving(false);
    }
  };

  const imcData = getIMCDetails();
  const calculatedAge = getCalculatedAge();

  return (
    <div className="page-container animate-fade-in">
      {/* Page Title */}
      <div className="page-header">
        <div>
          <button type="button" className="btn-back-link" onClick={onCancel}>
            ← Voltar para listagem
          </button>
          <h1 className="page-title">Cadastro de Novo Paciente</h1>
          <p className="page-subtitle">
            Preencha os dados abaixo para registrar a ficha completa do paciente.
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="form-tabs-container">
        <button
          type="button"
          className={`form-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
          onClick={() => setActiveTab('pessoal')}
        >
          <User size={18} />
          <span>1. Pessoal</span>
          {formData.nome.trim() && <span className="tab-check-dot">✓</span>}
        </button>

        <button
          type="button"
          className={`form-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
          onClick={() => setActiveTab('clinico')}
        >
          <Activity size={18} />
          <span>2. Clínico</span>
        </button>

        <button
          type="button"
          className={`form-tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
          onClick={() => setActiveTab('habitos')}
        >
          <Clock size={18} />
          <span>3. Hábitos</span>
        </button>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="error-alert animate-shake" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="success-alert animate-fade-in" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Content Card */}
      <form onSubmit={handleSubmit} className="form-card">
        {/* TAB 1: PESSOAL */}
        {activeTab === 'pessoal' && (
          <div className="tab-pane animate-fade-in">
            <h3 className="tab-heading">Dados Pessoais</h3>

            <div className="form-grid">
              {/* Nome Completo */}
              <div className="form-group full-width">
                <label className="required-label">Nome completo</label>
                <input
                  type="text"
                  placeholder="Ex: Maria Silva de Oliveira"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              {/* Data de Nascimento */}
              <div className="form-group">
                <label>Data de nascimento</label>
                <div className="input-with-calc">
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                  {calculatedAge && <span className="calc-badge">{calculatedAge}</span>}
                </div>
              </div>

              {/* Sexo */}
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

              {/* Telefone */}
              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                />
              </div>

              {/* WhatsApp */}
              <div className="form-group">
                <label>WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                />
              </div>

              {/* E-mail */}
              <div className="form-group full-width">
                <label>E-mail</label>
                <input
                  type="email"
                  placeholder="paciente@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLÍNICO */}
        {activeTab === 'clinico' && (
          <div className="tab-pane animate-fade-in">
            <h3 className="tab-heading">Avaliação Clínica e Histórico</h3>

            <div className="form-grid">
              {/* Peso em kg */}
              <div className="form-group">
                <label>Peso atual</label>
                <div className="unit-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={formData.peso_inicial}
                    onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                  />
                  <span className="unit-suffix">kg</span>
                </div>
              </div>

              {/* Altura em cm */}
              <div className="form-group">
                <label>Altura</label>
                <div className="unit-input-wrapper">
                  <input
                    type="number"
                    placeholder="170"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  />
                  <span className="unit-suffix">cm</span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
              <div className="form-group full-width">
                <label>IMC (Calculado automaticamente)</label>
                <div className="imc-display-box">
                  {imcData ? (
                    <div className="imc-result">
                      <span className="imc-number">{imcData.val} kg/m²</span>
                      <span className={`imc-badge ${imcData.colorClass}`}>{imcData.label}</span>
                    </div>
                  ) : (
                    <span className="imc-placeholder">
                      Informe peso (kg) e altura (cm) para visualizar o cálculo do IMC.
                    </span>
                  )}
                </div>
              </div>

              {/* Objetivos */}
              <div className="form-group full-width">
                <label>Objetivos do paciente</label>
                <div className="checkbox-options-grid">
                  {[
                    'Emagrecer',
                    'Ganhar massa',
                    'Controlar diabetes',
                    'Saúde geral',
                    'Performance esportiva',
                    'Reeducação alimentar'
                  ].map((obj) => (
                    <label key={obj} className="checkbox-chip">
                      <input
                        type="checkbox"
                        checked={formData.objetivos.includes(obj)}
                        onChange={() => handleToggleArray('objetivos', obj)}
                      />
                      <span>{obj}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  className="mt-2"
                  placeholder="Objetivo adicional em texto livre..."
                  value={formData.objetivo_texto}
                  onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                />
              </div>

              {/* Nível de Atividade Física */}
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

              {/* Patologias ou Condições */}
              <div className="form-group full-width">
                <label>Patologias ou condições de saúde</label>
                <div className="checkbox-options-grid">
                  {['Nenhum', 'Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map((pat) => (
                    <label key={pat} className="checkbox-chip">
                      <input
                        type="checkbox"
                        checked={formData.patologias.includes(pat)}
                        onChange={() => handleToggleArray('patologias', pat)}
                      />
                      <span>{pat}</span>
                    </label>
                  ))}
                </div>
                {/* Custom tag input */}
                <div className="custom-add-tag-box">
                  <input
                    type="text"
                    placeholder="Outra patologia ou condição..."
                    value={formData.patologia_custom}
                    onChange={(e) => setFormData({ ...formData, patologia_custom: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag('patologias', 'patologia_custom');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-add-tag"
                    onClick={() => handleAddCustomTag('patologias', 'patologia_custom')}
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                {/* Selected Tags list */}
                <div className="tags-container">
                  {formData.patologias.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag('patologias', tag)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Restrições Alimentares */}
              <div className="form-group full-width">
                <label>Restrições alimentares</label>
                <div className="checkbox-options-grid">
                  {['Nenhum', 'Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map((res) => (
                    <label key={res} className="checkbox-chip">
                      <input
                        type="checkbox"
                        checked={formData.restricoes_alimentares.includes(res)}
                        onChange={() => handleToggleArray('restricoes_alimentares', res)}
                      />
                      <span>{res}</span>
                    </label>
                  ))}
                </div>
                <div className="custom-add-tag-box">
                  <input
                    type="text"
                    placeholder="Outra restrição alimentar..."
                    value={formData.restricao_custom}
                    onChange={(e) => setFormData({ ...formData, restricao_custom: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag('restricoes_alimentares', 'restricao_custom');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-add-tag"
                    onClick={() => handleAddCustomTag('restricoes_alimentares', 'restricao_custom')}
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                <div className="tags-container">
                  {formData.restricoes_alimentares.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag('restricoes_alimentares', tag)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Alergias Alimentares */}
              <div className="form-group full-width">
                <label>Alergias alimentares</label>
                <div className="checkbox-options-grid">
                  {['Nenhum', 'Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map((ale) => (
                    <label key={ale} className="checkbox-chip">
                      <input
                        type="checkbox"
                        checked={formData.alergias.includes(ale)}
                        onChange={() => handleToggleArray('alergias', ale)}
                      />
                      <span>{ale}</span>
                    </label>
                  ))}
                </div>
                <div className="custom-add-tag-box">
                  <input
                    type="text"
                    placeholder="Outra alergia alimentar..."
                    value={formData.alergia_custom}
                    onChange={(e) => setFormData({ ...formData, alergia_custom: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag('alergias', 'alergia_custom');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-add-tag"
                    onClick={() => handleAddCustomTag('alergias', 'alergia_custom')}
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                <div className="tags-container">
                  {formData.alergias.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag('alergias', tag)}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Medicamentos */}
              <div className="form-group full-width">
                <label>Medicamentos contínuos</label>
                <textarea
                  rows="2"
                  placeholder="Liste medicamentos de uso diário ou contínuo..."
                  value={formData.medicamentos}
                  onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                />
              </div>

              {/* Suplementos */}
              <div className="form-group full-width">
                <label>Suplementos em uso</label>
                <textarea
                  rows="2"
                  placeholder="Ex: Whey protein, Creatina, Vitamina D..."
                  value={formData.suplementos}
                  onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HÁBITOS */}
        {activeTab === 'habitos' && (
          <div className="tab-pane animate-fade-in">
            <h3 className="tab-heading">Rotina e Hábitos Diários</h3>

            <div className="form-grid">
              {/* Quantidade de refeições por dia */}
              <div className="form-group">
                <label>Quantas refeições faz por dia?</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.refeicoes_por_dia}
                  onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                />
              </div>

              {/* Quantidade de água por dia */}
              <div className="form-group">
                <label>Consumo de água diário</label>
                <div className="unit-input-wrapper">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="2.5"
                    value={formData.litros_agua}
                    onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                  />
                  <span className="unit-suffix">litros</span>
                </div>
              </div>

              {/* Horário que acorda */}
              <div className="form-group">
                <label>Horário que acorda</label>
                <input
                  type="text"
                  placeholder="Ex: 6 ou 06:30"
                  value={formData.horario_acorda}
                  onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                  onBlur={() => handleTimeBlur('horario_acorda')}
                />
                <span className="field-hint">Converte automaticamente (ex: 630 → 06:30)</span>
              </div>

              {/* Horário que dorme */}
              <div className="form-group">
                <label>Horário que dorme</label>
                <input
                  type="text"
                  placeholder="Ex: 23 ou 22:30"
                  value={formData.horario_dorme}
                  onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                  onBlur={() => handleTimeBlur('horario_dorme')}
                />
                <span className="field-hint">Converte automaticamente (ex: 2230 → 22:30)</span>
              </div>

              {/* Pratica atividade física */}
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

              {/* Atividade física descrição (condicional) */}
              {formData.atividade_fisica && (
                <div className="form-group full-width animate-fade-in">
                  <label>Qual atividade e frequência semanal?</label>
                  <input
                    type="text"
                    placeholder="Ex: Musculação 4x na semana, Corrida 2x na semana..."
                    value={formData.atividade_fisica_descricao}
                    onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                  />
                </div>
              )}

              {/* Observações gerais */}
              <div className="form-group full-width">
                <label>Observações gerais</label>
                <textarea
                  rows="3"
                  placeholder="Anotações adicionais sobre o estilo de vida, preferências ou histórico do paciente..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons / Navigation controls */}
        <div className="form-actions-footer">
          <div className="left-actions">
            {activeTab !== 'pessoal' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (activeTab === 'habitos') setActiveTab('clinico');
                  else if (activeTab === 'clinico') setActiveTab('pessoal');
                }}
              >
                <ArrowLeft size={16} /> Anterior
              </button>
            )}
          </div>

          <div className="right-actions">
            {activeTab !== 'habitos' ? (
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  if (activeTab === 'pessoal') {
                    if (!formData.nome.trim()) {
                      setErrorMsg('O nome completo do paciente é obrigatório.');
                      return;
                    }
                    setErrorMsg('');
                    setActiveTab('clinico');
                  } else if (activeTab === 'clinico') {
                    setActiveTab('habitos');
                  }
                }}
              >
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary-action btn-save-action"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-sm"></span> Salvar Ficha...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Salvar Paciente
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
