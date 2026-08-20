import React, { useState } from 'react';
import { X, Calendar, Save, AlertCircle } from 'lucide-react';
import { createConsulta } from '../services/patients';

export default function ConsultaModal({ patientId, onClose, onConsultaCreated }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    data_consulta: todayStr,
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      setError('Por favor, informe o peso atual do paciente em kg.');
      return;
    }

    setSaving(true);
    try {
      const created = await createConsulta(patientId, formData);
      if (onConsultaCreated) {
        onConsultaCreated(created);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao registrar consulta. Tente novamente.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <Calendar size={22} className="text-emerald-600" />
            <h3>Registrar Nova Consulta</h3>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-alert mt-3" style={{ margin: '1rem 1.5rem 0 1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Data da Consulta */}
            <div className="form-group">
              <label className="required-label">Data da consulta</label>
              <input
                type="date"
                value={formData.data_consulta}
                onChange={(e) => setFormData({ ...formData, data_consulta: e.target.value })}
                required
              />
            </div>

            {/* Peso atual em kg */}
            <div className="form-group">
              <label className="required-label">Peso atual em kg</label>
              <div className="unit-input-wrapper">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 68.5"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  required
                  autoFocus
                />
                <span className="unit-suffix">kg</span>
              </div>
            </div>

            {/* Cintura em cm */}
            <div className="form-group">
              <label>Cintura (opcional)</label>
              <div className="unit-input-wrapper">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ex: 75"
                  value={formData.cintura}
                  onChange={(e) => setFormData({ ...formData, cintura: e.target.value })}
                />
                <span className="unit-suffix">cm</span>
              </div>
            </div>

            {/* Quadril em cm */}
            <div className="form-group">
              <label>Quadril (opcional)</label>
              <div className="unit-input-wrapper">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ex: 98"
                  value={formData.quadril}
                  onChange={(e) => setFormData({ ...formData, quadril: e.target.value })}
                />
                <span className="unit-suffix">cm</span>
              </div>
            </div>

            {/* % de Gordura */}
            <div className="form-group">
              <label>% de gordura (opcional)</label>
              <div className="unit-input-wrapper">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 22.4"
                  value={formData.percentual_gordura}
                  onChange={(e) => setFormData({ ...formData, percentual_gordura: e.target.value })}
                />
                <span className="unit-suffix">%</span>
              </div>
            </div>

            {/* Próximo retorno */}
            <div className="form-group">
              <label>Próximo retorno (opcional)</label>
              <input
                type="date"
                value={formData.proximo_retorno}
                onChange={(e) => setFormData({ ...formData, proximo_retorno: e.target.value })}
              />
            </div>

            {/* Observações */}
            <div className="form-group full-width">
              <label>Observações da consulta</label>
              <textarea
                rows="3"
                placeholder="Anotações sobre a evolução, queixas, adaptações na rotina..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary-action" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-sm"></span> Salvando...
                </>
              ) : (
                <>
                  <Save size={18} /> Salvar consulta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
