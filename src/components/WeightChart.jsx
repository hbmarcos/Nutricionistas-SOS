import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Minus, Calendar, Scale } from 'lucide-react';

export default function WeightChart({ consultas = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!consultas || consultas.length === 0) {
    return (
      <div className="weight-chart-card empty">
        <div className="chart-empty-icon">
          <Scale size={36} />
        </div>
        <h4>Nenhuma consulta registrada ainda</h4>
        <p>Cadastre consultas para visualizar o gráfico de evolução de peso do paciente ao longo do tempo.</p>
      </div>
    );
  }

  // Ordenar consultas da mais antiga para a mais recente para o gráfico (esquerda -> direita)
  const sortedConsultas = [...consultas].sort(
    (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  );

  const weights = sortedConsultas.map((c) => parseFloat(c.peso) || 0);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  const firstWeight = weights[0];
  const lastWeight = weights[weights.length - 1];
  const weightDiff = lastWeight - firstWeight;

  // Render SVG Chart dimensions
  const svgWidth = 700;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 35;

  const widthArea = svgWidth - paddingX * 2;
  const heightArea = svgHeight - paddingY * 2;

  // Prevent division by zero if all weights are identical or 1 consultation
  const weightRange = maxWeight === minWeight ? 10 : maxWeight - minWeight;
  const paddingWeightMin = Math.max(0, minWeight - weightRange * 0.15);
  const paddingWeightMax = maxWeight + weightRange * 0.15;
  const effectiveRange = paddingWeightMax - paddingWeightMin;

  const points = sortedConsultas.map((c, i) => {
    const x =
      sortedConsultas.length === 1
        ? svgWidth / 2
        : paddingX + (i / (sortedConsultas.length - 1)) * widthArea;

    const y =
      svgHeight -
      paddingY -
      ((parseFloat(c.peso) - paddingWeightMin) / effectiveRange) * heightArea;

    return {
      x,
      y,
      peso: parseFloat(c.peso),
      data: c.data_consulta,
      raw: c
    };
  });

  // Polyline string
  const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Gradient area path
  const areaPathStr =
    points.length > 0
      ? `M ${points[0].x},${svgHeight - paddingY} ` +
        points.map((p) => `L ${p.x},${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x},${svgHeight - paddingY} Z`
      : '';

  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
      }
    } catch {
      // ignore
    }
    return typeof dateVal === 'string' ? dateVal : '';
  };

  return (
    <div className="weight-chart-card">
      <div className="chart-header">
        <div className="chart-title-box">
          <Scale size={20} className="chart-icon" />
          <h3>Evolução de Peso</h3>
        </div>

        {sortedConsultas.length > 1 && (
          <div className="chart-stat-badge">
            <span className="stat-badge-label">Variação Total:</span>
            <span
              className={`stat-badge-val ${
                weightDiff < 0 ? 'diff-negative' : weightDiff > 0 ? 'diff-positive' : 'diff-neutral'
              }`}
            >
              {weightDiff < 0 ? (
                <>
                  <TrendingDown size={15} /> {weightDiff.toFixed(1)} kg
                </>
              ) : weightDiff > 0 ? (
                <>
                  <TrendingUp size={15} /> +{weightDiff.toFixed(1)} kg
                </>
              ) : (
                <>
                  <Minus size={15} /> 0.0 kg
                </>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="svg-chart-wrapper">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="weight-svg">
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const yVal = paddingY + ratio * heightArea;
            const weightVal = (paddingWeightMax - ratio * effectiveRange).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={yVal}
                  x2={svgWidth - paddingX}
                  y2={yVal}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={yVal + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="11"
                  fontWeight="600"
                >
                  {weightVal}kg
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {points.length > 1 && <path d={areaPathStr} fill="url(#weightGrad)" />}

          {/* Connecting line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsStr}
            />
          )}

          {/* Data points & labels */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx} className="chart-point-group">
                {/* Vertical helper line on hover */}
                {isHovered && (
                  <line
                    x1={p.x}
                    y1={paddingY}
                    x2={p.x}
                    y2={svgHeight - paddingY}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? "8" : "5"}
                  fill="#ffffff"
                  stroke="#047857"
                  strokeWidth="3"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                />

                {/* Weight value above point */}
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fill="#064e3b"
                  fontSize="12"
                  fontWeight="700"
                >
                  {p.peso} kg
                </text>

                {/* Date below X axis */}
                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="11"
                  fontWeight="500"
                >
                  {formatDate(p.data)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip summary bar if point hovered */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div className="chart-tooltip-bar animate-fade-in">
          <div className="tooltip-item">
            <Calendar size={14} /> <span>Data: {formatDate(points[hoveredIndex].data)}</span>
          </div>
          <div className="tooltip-item">
            <Scale size={14} /> <span>Peso: {points[hoveredIndex].peso} kg</span>
          </div>
          {points[hoveredIndex].raw.cintura && (
            <div className="tooltip-item">
              <span>Cintura: {points[hoveredIndex].raw.cintura} cm</span>
            </div>
          )}
          {points[hoveredIndex].raw.percentual_gordura && (
            <div className="tooltip-item">
              <span>Gordura: {points[hoveredIndex].raw.percentual_gordura}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
