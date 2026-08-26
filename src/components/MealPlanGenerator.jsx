import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  Trash2,
  Calendar,
  Coffee,
  Sun,
  Moon,
  Apple,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Edit3,
  RefreshCw,
  Info
} from 'lucide-react';
import { createPlanoAlimentar, deletePlanoAlimentar } from '../services/patients';

// Dias da semana padrão
const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

// Configuração das 5 refeições padrão
const REFEICOES_CONFIG = [
  { key: 'cafe_da_manha', label: 'Café da Manhã', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'lanche_manha', label: 'Lanche da Manhã', icon: Apple, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'almoco', label: 'Almoço', icon: Sun, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: 'lanche_tarde', label: 'Lanche da Tarde', icon: Apple, color: 'text-teal-600', bg: 'bg-teal-50' },
  { key: 'jantar', label: 'Jantar', icon: Moon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
];

// Template vazio de plano semanal com 5 opções por refeição
function createEmptyWeeklyPlan() {
  return {
    plano_semanal: DIAS_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', '']
      }
    }))
  };
}

// Mensagens dinâmicas para o loading da IA
const LOADING_MESSAGES = [
  'Lendo histórico e anamnese do paciente...',
  'Analisando objetivos, restrições e alergias...',
  'IA calculando cardápio semanal variado e equilibrado...',
  'Formatando 5 opções de alimentos para cada refeição...',
  'Finalizando plano alimentar personalizado...'
];

export default function MealPlanGenerator({ patient, plans = [], onPlanSaved }) {
  // Estado do plano em edição (null quando nenhum plano estiver sendo editado/gerado)
  const [currentPlan, setCurrentPlan] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Estados de IA e Loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Mensagens de Feedback
  const [errorToast, setErrorToast] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  // Histórico
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [historyActiveDay, setHistoryActiveDay] = useState({});

  // Ref para rolagem suave ao abrir editor
  const editorRef = useRef(null);

  // Timer para alternar mensagens de loading dinâmico
  useEffect(() => {
    let interval;
    if (isGenerating) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Função principal para acionar a Serverless Function /api/gerar-plano
  const handleGenerateAIPlan = async () => {
    if (!patient) return;
    setErrorToast(null);
    setSuccessToast('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paciente: patient })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao gerar o plano com IA.');
      }

      if (!result.data || !Array.isArray(result.data.plano_semanal)) {
        throw new Error('O formato retornado pela IA é inválido.');
      }

      // Normaliza o retorno garantindo que todos os 7 dias e refeições existam com arrays
      const normalizedPlan = normalizePlanStructure(result.data);
      setCurrentPlan(normalizedPlan);
      setActiveDayIndex(0);
      setSuccessToast('✨ Plano alimentar gerado com sucesso pela IA! Você pode revisar e editar antes de salvar.');
      setTimeout(() => setSuccessToast(''), 5000);

      // Scroll suave para o editor
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      console.error('Erro na geração com IA:', err);
      setErrorToast({
        message: 'Não foi possível gerar o plano com IA no momento.',
        details: err.message,
        canRetry: true
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Criação de plano manual (fallback ou escolha do usuário)
  const handleCreateManualPlan = () => {
    setErrorToast(null);
    setCurrentPlan(createEmptyWeeklyPlan());
    setActiveDayIndex(0);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Normaliza a estrutura para garantir 7 dias e 5 refeições
  const normalizePlanStructure = (rawPlan) => {
    const rawWeekly = rawPlan.plano_semanal || [];
    const fullPlan = DIAS_SEMANA.map((diaNome, idx) => {
      const existingDay = rawWeekly.find(
        (d) => d.dia && d.dia.toLowerCase().includes(diaNome.split('-')[0].toLowerCase())
      ) || rawWeekly[idx] || {};

      const existingRefeicoes = existingDay.refeicoes || {};

      const refeicoes = {};
      REFEICOES_CONFIG.forEach((ref) => {
        let options = existingRefeicoes[ref.key];
        if (!Array.isArray(options)) {
          options = typeof options === 'string' ? [options] : [];
        }
        // Garante no mínimo 5 itens (preenchidos ou vazios)
        while (options.length < 5) {
          options.push('');
        }
        refeicoes[ref.key] = options;
      });

      return {
        dia: diaNome,
        refeicoes
      };
    });

    return { plano_semanal: fullPlan };
  };

  // Atualiza um input específico de opção de refeição
  const handleOptionChange = (dayIdx, mealKey, optionIdx, value) => {
    if (!currentPlan) return;
    const newWeekly = [...currentPlan.plano_semanal];
    const currentDay = { ...newWeekly[dayIdx] };
    const currentMealOptions = [...(currentDay.refeicoes[mealKey] || [])];

    currentMealOptions[optionIdx] = value;
    currentDay.refeicoes = {
      ...currentDay.refeicoes,
      [mealKey]: currentMealOptions
    };

    newWeekly[dayIdx] = currentDay;
    setCurrentPlan({ plano_semanal: newWeekly });
  };

  // Adiciona mais um input de opção a uma refeição
  const handleAddOption = (dayIdx, mealKey) => {
    if (!currentPlan) return;
    const newWeekly = [...currentPlan.plano_semanal];
    const currentDay = { ...newWeekly[dayIdx] };
    const currentMealOptions = [...(currentDay.refeicoes[mealKey] || [])];

    currentMealOptions.push('');
    currentDay.refeicoes = {
      ...currentDay.refeicoes,
      [mealKey]: currentMealOptions
    };

    newWeekly[dayIdx] = currentDay;
    setCurrentPlan({ plano_semanal: newWeekly });
  };

  // Remove um input de opção de uma refeição
  const handleRemoveOption = (dayIdx, mealKey, optionIdx) => {
    if (!currentPlan) return;
    const newWeekly = [...currentPlan.plano_semanal];
    const currentDay = { ...newWeekly[dayIdx] };
    const currentMealOptions = [...(currentDay.refeicoes[mealKey] || [])];

    if (currentMealOptions.length <= 1) {
      currentMealOptions[0] = '';
    } else {
      currentMealOptions.splice(optionIdx, 1);
    }

    currentDay.refeicoes = {
      ...currentDay.refeicoes,
      [mealKey]: currentMealOptions
    };

    newWeekly[dayIdx] = currentDay;
    setCurrentPlan({ plano_semanal: newWeekly });
  };

  // Copia o cardápio do dia atual para todos os outros dias da semana
  const handleReplicateDayToAll = (sourceDayIdx) => {
    if (!currentPlan) return;
    const sourceDay = currentPlan.plano_semanal[sourceDayIdx];
    if (!sourceDay) return;

    if (!window.confirm(`Deseja copiar as refeições de ${sourceDay.dia} para todos os outros dias da semana?`)) {
      return;
    }

    const updated = currentPlan.plano_semanal.map((day) => ({
      dia: day.dia,
      refeicoes: JSON.parse(JSON.stringify(sourceDay.refeicoes))
    }));

    setCurrentPlan({ plano_semanal: updated });
    setSuccessToast(`Cardápio de ${sourceDay.dia} replicado para toda a semana.`);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  // Salva o plano alimentar atual no Neon DB
  const handleSavePlan = async () => {
    if (!currentPlan || !patient?.id) return;
    setIsSaving(true);
    setErrorToast(null);

    try {
      // Limpa opções vazias extras mantendo o que foi preenchido
      const cleanedPlan = {
        plano_semanal: currentPlan.plano_semanal.map((day) => {
          const cleanedRefeicoes = {};
          Object.entries(day.refeicoes).forEach(([key, options]) => {
            const filtered = options.map((opt) => (typeof opt === 'string' ? opt.trim() : '')).filter(Boolean);
            cleanedRefeicoes[key] = filtered.length > 0 ? filtered : ['Opção livre recomendada'];
          });
          return {
            dia: day.dia,
            refeicoes: cleanedRefeicoes
          };
        })
      };

      await createPlanoAlimentar(patient.id, cleanedPlan);
      setCurrentPlan(null);
      setSuccessToast('Plano Alimentar salvo com sucesso no prontuário!');
      setTimeout(() => setSuccessToast(''), 4000);

      if (onPlanSaved) {
        onPlanSaved();
      }
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
      setErrorToast({
        message: 'Erro ao salvar plano alimentar no banco de dados.',
        details: err.message,
        canRetry: false
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Carrega um plano do histórico para edição
  const handleEditHistoricalPlan = (plan) => {
    try {
      const conteudo = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : plan.conteudo;
      const normalized = normalizePlanStructure(conteudo);
      setCurrentPlan(normalized);
      setActiveDayIndex(0);
      setSuccessToast(`Plano de ${formatDate(plan.created_at)} carregado no editor.`);
      setTimeout(() => setSuccessToast(''), 3500);
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e) {
      console.error(e);
      alert('Não foi possível carregar os dados deste plano.');
    }
  };

  // Exclui um plano do histórico
  const handleDeleteHistoricalPlan = async (planId) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano alimentar do histórico?')) {
      return;
    }
    try {
      await deletePlanoAlimentar(planId, patient?.id);
      setSuccessToast('Plano removido com sucesso.');
      setTimeout(() => setSuccessToast(''), 3000);
      if (onPlanSaved) {
        onPlanSaved();
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir plano.');
    }
  };

  // Formatação de data
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : '';
      return d.toLocaleDateString('pt-BR');
    } catch {
      return typeof dateVal === 'string' ? dateVal : '';
    }
  };

  // Formatação de hora
  const formatTime = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const activeDay = currentPlan?.plano_semanal[activeDayIndex] || null;

  return (
    <div className="meal-plan-generator-container">
      {/* Toast Feedback de Sucesso */}
      {successToast && (
        <div className="feedback-toast toast-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{successToast}</span>
          <button type="button" onClick={() => setSuccessToast('')} className="toast-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toast Feedback de Erro com Fallback */}
      {errorToast && (
        <div className="feedback-toast toast-error animate-fade-in">
          <AlertCircle size={20} className="toast-icon" />
          <div className="toast-body">
            <strong>{errorToast.message}</strong>
            {errorToast.details && <p className="toast-details">{errorToast.details}</p>}
            <p className="toast-prompt">Deseja tentar novamente ou criar um Plano Manual?</p>
            <div className="toast-actions">
              {errorToast.canRetry && (
                <button
                  type="button"
                  className="btn-toast-action btn-toast-retry"
                  onClick={handleGenerateAIPlan}
                  disabled={isGenerating}
                >
                  <RefreshCw size={14} className={isGenerating ? 'spin' : ''} /> Tentar Novamente
                </button>
              )}
              <button
                type="button"
                className="btn-toast-action btn-toast-manual"
                onClick={handleCreateManualPlan}
              >
                <Edit3 size={14} /> Criar Plano Manual
              </button>
            </div>
          </div>
          <button type="button" onClick={() => setErrorToast(null)} className="toast-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Toolbar Principal */}
      <div className="section-toolbar mb-4">
        <div>
          <h2 className="section-title">Planos Alimentares Semanais</h2>
          <p className="section-subtitle">
            Gere cardápios personalizados e ajustados aos objetivos e restrições do paciente.
          </p>
        </div>

        <div className="plan-actions-group">
          <button
            type="button"
            className="btn-primary-action btn-ai-sparkle"
            onClick={handleGenerateAIPlan}
            disabled={isGenerating || isSaving}
            title="Gera automaticamente um cardápio semanal completo utilizando IA"
          >
            <Sparkles size={18} className={isGenerating ? 'spin' : ''} />
            <span>{isGenerating ? 'Gerando Plano...' : '✨ Gerar Plano com IA'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary-action"
            onClick={handleCreateManualPlan}
            disabled={isGenerating || isSaving}
            title="Criar um plano semanal em branco para preenchimento manual"
          >
            <Plus size={18} />
            <span>Criar Manual</span>
          </button>
        </div>
      </div>

      {/* OVERLAY DE LOADING DA IA */}
      {isGenerating && (
        <div className="ai-loading-card animate-fade-in">
          <div className="ai-loading-header">
            <div className="ai-pulse-orb">
              <Sparkles size={28} className="ai-sparkle-icon spin" />
            </div>
            <div className="ai-loading-info">
              <h3>Inteligência Artificial em Ação</h3>
              <p className="ai-loading-subtitle">
                O Gemini está analisando anamnese, metas e restrições de <strong>{patient.nome}</strong>.
              </p>
            </div>
          </div>

          {/* Mensagem Dinâmica Rotativa */}
          <div className="dynamic-message-box">
            <div className="spinner-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <p className="dynamic-message-text animate-fade-in" key={loadingMessageIndex}>
              {LOADING_MESSAGES[loadingMessageIndex]}
            </p>
          </div>

          <div className="ai-progress-bar-container">
            <div className="ai-progress-bar-fill"></div>
          </div>
        </div>
      )}

      {/* ÁREA DO EDITOR DE PLANO ALIMENTAR (SE HOUVER PLANO ATIVO) */}
      {currentPlan && !isGenerating && (
        <div ref={editorRef} className="meal-plan-editor-card animate-fade-in mb-6">
          <div className="editor-card-header">
            <div className="editor-title-box">
              <span className="editor-badge-tag">Editor de Cardápio</span>
              <h3 className="editor-main-title">Plano Alimentar Semanal Personalizado</h3>
              <p className="editor-desc">
                Alterne entre os dias da semana e edite livremente as 5 opções de cada refeição antes de salvar.
              </p>
            </div>

            <div className="editor-header-actions">
              <button
                type="button"
                className="btn-replicate"
                onClick={() => handleReplicateDayToAll(activeDayIndex)}
                title="Copiar refeições deste dia para os demais"
              >
                <Copy size={16} /> Replicar {DIAS_SEMANA[activeDayIndex]} para a semana
              </button>

              <button
                type="button"
                className="btn-discard-plan"
                onClick={() => {
                  if (window.confirm('Deseja descartar as alterações não salvas deste plano?')) {
                    setCurrentPlan(null);
                  }
                }}
              >
                <X size={16} /> Cancelar
              </button>

              <button
                type="button"
                className="btn-primary-action btn-save-plan-cta"
                onClick={handleSavePlan}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-sm"></span> Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Salvar Plano Alimentar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ABAS DOS DIAS DA SEMANA */}
          <div className="days-tabs-nav">
            {DIAS_SEMANA.map((dia, idx) => {
              const isActive = activeDayIndex === idx;
              return (
                <button
                  key={dia}
                  type="button"
                  className={`day-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveDayIndex(idx)}
                >
                  <Calendar size={15} />
                  <span>{dia}</span>
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DAS REFEIÇÕES DO DIA ATIVO */}
          {activeDay && (
            <div className="day-meals-container">
              <div className="day-info-banner">
                <span className="day-label-pill">{activeDay.dia}</span>
                <span className="day-sub-hint">
                  Defina até 5 opções nutritivas para cada uma das refeições abaixo.
                </span>
              </div>

              <div className="meals-grid-layout">
                {REFEICOES_CONFIG.map((refConfig) => {
                  const MealIcon = refConfig.icon;
                  const options = activeDay.refeicoes[refConfig.key] || ['', '', '', '', ''];

                  return (
                    <div key={refConfig.key} className="meal-column-card">
                      <div className={`meal-card-top ${refConfig.bg}`}>
                        <div className="meal-icon-title">
                          <MealIcon size={18} className={refConfig.color} />
                          <h4 className="meal-card-title">{refConfig.label}</h4>
                        </div>
                        <span className="options-count-badge">{options.length} opções</span>
                      </div>

                      <div className="meal-options-inputs-list">
                        {options.map((optVal, optIdx) => (
                          <div key={optIdx} className="option-input-row">
                            <span className="option-number-label">Opção {optIdx + 1}</span>
                            <div className="input-with-actions">
                              <input
                                type="text"
                                className="form-control-input meal-option-input"
                                placeholder={`Ex: Opção ${optIdx + 1} para ${refConfig.label.toLowerCase()}...`}
                                value={optVal}
                                onChange={(e) =>
                                  handleOptionChange(activeDayIndex, refConfig.key, optIdx, e.target.value)
                                }
                              />
                              {options.length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-option"
                                  onClick={() => handleRemoveOption(activeDayIndex, refConfig.key, optIdx)}
                                  title="Remover esta opção"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="btn-add-option-row"
                          onClick={() => handleAddOption(activeDayIndex, refConfig.key)}
                        >
                          <Plus size={14} /> Adicionar Opção
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FOOTER DE SALVAR NA PARTE INFERIOR DO CARD */}
              <div className="editor-card-footer">
                <div className="editor-footer-hint">
                  <Info size={16} />
                  <span>
                    O plano será gravado no prontuário do paciente e poderá ser consultado ou impresso a qualquer momento.
                  </span>
                </div>
                <div className="editor-footer-buttons">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCurrentPlan(null)}
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={handleSavePlan}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-sm"></span> Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Salvar Plano Alimentar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTÓRICO DE PLANOS ALIMENTARES */}
      <div className="planos-history-section">
        <div className="history-header-row">
          <h3 className="consultas-list-title">Histórico de Planos do Paciente ({plans.length})</h3>
        </div>

        {plans.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '3rem 2rem' }}>
            <div className="empty-icon-circle">
              <FileText size={36} />
            </div>
            <h3>Nenhum plano alimentar gerado ainda</h3>
            <p>
              Clique no botão <strong>"✨ Gerar Plano com IA"</strong> acima para criar automaticamente um cardápio semanal completo e personalizado.
            </p>
          </div>
        ) : (
          <div className="planos-history-grid">
            {plans.map((plan) => {
              const isExpanded = expandedPlanId === plan.id;
              let parsedContent = null;
              try {
                parsedContent = typeof plan.conteudo === 'string' ? JSON.parse(plan.conteudo) : plan.conteudo;
              } catch {
                parsedContent = null;
              }

              const planWeekly = parsedContent?.plano_semanal || [];
              const selectedHistoryDay = historyActiveDay[plan.id] || 0;

              return (
                <div key={plan.id} className={`historical-plan-card ${isExpanded ? 'expanded' : ''}`}>
                  {/* Cabeçalho do Card */}
                  <div
                    className="historical-plan-header"
                    onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  >
                    <div className="plan-header-left">
                      <div className="plan-icon-badge">
                        <FileText size={20} className="text-emerald-600" />
                      </div>
                      <div className="plan-meta-info">
                        <div className="plan-title-line">
                          <strong>Plano Alimentar Semanal</strong>
                          <span className="badge-pill-date">{formatDate(plan.created_at)}</span>
                        </div>
                        <span className="plan-time-sub">
                          Criado às {formatTime(plan.created_at)} • {planWeekly.length || 7} dias configurados
                        </span>
                      </div>
                    </div>

                    <div className="plan-header-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-plan-action"
                        onClick={() => handleEditHistoricalPlan(plan)}
                        title="Carregar este plano no editor para fazer ajustes"
                      >
                        <Edit3 size={15} /> Editar / Duplicar
                      </button>

                      <button
                        type="button"
                        className="btn-plan-action btn-plan-delete"
                        onClick={() => handleDeleteHistoricalPlan(plan.id)}
                        title="Excluir este plano"
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-expand-arrow"
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Detalhes Expansíveis do Plano com Abas dos Dias */}
                  {isExpanded && parsedContent && (
                    <div className="historical-plan-expanded-body animate-fade-in">
                      {planWeekly.length > 0 ? (
                        <>
                          {/* Navegador de Dias no Histórico */}
                          <div className="history-day-tabs">
                            {planWeekly.map((d, dIdx) => (
                              <button
                                key={dIdx}
                                type="button"
                                className={`history-day-tab ${selectedHistoryDay === dIdx ? 'active' : ''}`}
                                onClick={() =>
                                  setHistoryActiveDay({ ...historyActiveDay, [plan.id]: dIdx })
                                }
                              >
                                {d.dia || `Dia ${dIdx + 1}`}
                              </button>
                            ))}
                          </div>

                          {/* Refeições do Dia Selecionado */}
                          {planWeekly[selectedHistoryDay] && (
                            <div className="history-day-content">
                              <h4 className="history-day-title">
                                {planWeekly[selectedHistoryDay].dia}
                              </h4>
                              <div className="history-meals-grid">
                                {REFEICOES_CONFIG.map((refConfig) => {
                                  const MealIcon = refConfig.icon;
                                  const options =
                                    planWeekly[selectedHistoryDay].refeicoes?.[refConfig.key] || [];

                                  return (
                                    <div key={refConfig.key} className="history-meal-box">
                                      <div className="history-meal-head">
                                        <MealIcon size={16} className={refConfig.color} />
                                        <h5>{refConfig.label}</h5>
                                      </div>
                                      <ul className="history-options-list">
                                        {Array.isArray(options) && options.length > 0 ? (
                                          options.map((opt, oIdx) => (
                                            <li key={oIdx} className="history-option-item">
                                              <span className="opt-bullet">•</span>
                                              <span>{opt}</span>
                                            </li>
                                          ))
                                        ) : (
                                          <li className="history-option-item text-muted">
                                            <em>Sem opções especificadas</em>
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <pre className="plano-json-view">
                          {JSON.stringify(parsedContent, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
