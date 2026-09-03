import React, { useState, useEffect } from 'react';
import {
  X,
  ChefHat,
  Clock,
  Flame,
  Users,
  CheckCircle2,
  Sparkles,
  Copy,
  Printer,
  AlertCircle,
  RefreshCw,
  Utensils
} from 'lucide-react';

export default function RecipeModal({ prato, paciente, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRecipe() {
      if (!prato) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gerar-receita', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prato, paciente })
        });

        const rawText = await response.text();
        let result;
        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error('Servidor retornou uma resposta em formato inválido. Tente novamente.');
        }

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Não foi possível gerar a receita.');
        }

        if (isMounted) {
          setRecipe(result.data);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(err.message || 'Erro ao comunicar com a IA de receitas.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRecipe();

    return () => {
      isMounted = false;
    };
  }, [prato, paciente]);

  const handleCopyRecipe = () => {
    if (!recipe) return;

    const formattedText = `
🍳 RECEITA SUGERIDA: ${recipe.titulo || prato}
⏱️ Tempo de preparo: ${recipe.tempo_preparo || 'N/A'}
📊 Dificuldade: ${recipe.dificuldade || 'N/A'} | Rendimento: ${recipe.rendimento || 'N/A'} | ${recipe.calorias_estimadas || ''}

🛒 INGREDIENTES:
${(recipe.ingredientes || []).map((ing) => `- ${ing}`).join('\n')}

👨‍🍳 MODO DE PREPARO:
${(recipe.modo_preparo || []).map((step, i) => `${i + 1}. ${step}`).join('\n')}

💡 DICA DO NUTRICIONISTA:
${recipe.dica_nutricionista || ''}
    `.trim();

    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-card recipe-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <ChefHat size={24} className="text-emerald-600" />
            <div>
              <h3>Sugestão de Receita {paciente?.nome ? `para ${paciente.nome}` : ''}</h3>
              <p className="modal-subtitle-text">{prato}</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="modal-body-scrollable">
          {loading ? (
            <div className="recipe-loading-box">
              <div className="spinner-green"></div>
              <h4>Chef IA elaborando a receita...</h4>
              <p>Formatando ingredientes e modo de preparo ideal em Português do Brasil.</p>
            </div>
          ) : error ? (
            <div className="error-card" style={{ margin: '1rem 0' }}>
              <AlertCircle size={24} color="#dc2626" />
              <p>{error}</p>
              <button
                type="button"
                className="btn-secondary mt-2"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                }}
              >
                <RefreshCw size={16} /> Tentar novamente
              </button>
            </div>
          ) : recipe ? (
            <div className="recipe-content-container animate-fade-in">
              {/* Recipe Title & Badges */}
              <div className="recipe-header-banner">
                <h2 className="recipe-main-title">{recipe.titulo}</h2>
                <div className="recipe-badges-row">
                  {recipe.tempo_preparo && (
                    <span className="recipe-badge">
                      <Clock size={14} /> {recipe.tempo_preparo}
                    </span>
                  )}
                  {recipe.dificuldade && (
                    <span className="recipe-badge">
                      <Utensils size={14} /> {recipe.dificuldade}
                    </span>
                  )}
                  {recipe.rendimento && (
                    <span className="recipe-badge">
                      <Users size={14} /> {recipe.rendimento}
                    </span>
                  )}
                  {recipe.calorias_estimadas && (
                    <span className="recipe-badge recipe-badge-cal">
                      <Flame size={14} /> {recipe.calorias_estimadas}
                    </span>
                  )}
                </div>
              </div>

              {/* Ingredientes */}
              <div className="recipe-section">
                <h4 className="recipe-section-title">🛒 Ingredientes Necessários</h4>
                <ul className="recipe-ingredients-list">
                  {(recipe.ingredientes || []).map((ing, idx) => (
                    <li key={idx} className="ingredient-item">
                      <span className="bullet-dot">•</span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modo de Preparo */}
              <div className="recipe-section">
                <h4 className="recipe-section-title">👨‍🍳 Modo de Preparo Passo a Passo</h4>
                <ol className="recipe-steps-list">
                  {(recipe.modo_preparo || []).map((step, idx) => (
                    <li key={idx} className="step-item">
                      <span className="step-number">{idx + 1}</span>
                      <span className="step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Dica do Nutricionista */}
              {recipe.dica_nutricionista && (
                <div className="recipe-nutri-tip-card">
                  <div className="tip-header">
                    <Sparkles size={18} className="text-amber-500" />
                    <span>Dica do Nutricionista</span>
                  </div>
                  <p>{recipe.dica_nutricionista}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        {!loading && recipe && (
          <div className="modal-footer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyRecipe}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={16} color="#059669" /> Copiado!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copiar Receita
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-primary-action"
              onClick={handlePrint}
            >
              <Printer size={16} /> Imprimir / Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
