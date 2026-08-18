# Design System — Nutricionistas-SOS

## Paleta de Cores (CSS Custom Properties em `index.css`)

### Tons Primários (Verde Esmeralda)
```css
--primary-50:  #ecfdf5
--primary-100: #d1fae5
--primary-200: #a7f3d0
--primary-400: #34d399
--primary-500: #10b981
--primary-600: #059669
--primary-700: #047857
--primary-800: #065f46
--primary-900: #064e3b
```

### Texto
```css
--text-main:   #1e293b   /* Texto principal escuro */
--text-muted:  #64748b   /* Texto secundário/dicas */
--text-light:  #94a3b8   /* Ícones e placeholders */
```

### Erros
```css
--error-50:  #fef2f2
--error-200: #fecaca
--error-600: #dc2626
```

### Cards e Superfícies
```css
--card-bg:      rgba(255, 255, 255, 0.85)  /* Glassmorphism */
--card-shadow:  0 8px 32px rgba(4, 120, 87, 0.12), 0 1.5px 4px rgba(4, 120, 87, 0.08)
```

## Border Radius
```css
--border-radius-sm: 6px
--border-radius-md: 10px
--border-radius-lg: 18px
```

## Transições
```css
--transition-fast:   all 0.15s ease
--transition-normal: all 0.2s ease
```

## Tipografia
- **Fonte**: Inter (Google Fonts)
- Body base: `16px`
- Headings: `font-weight: 700`

## Background Global
```css
background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%);
```
Decorações flutuantes com `blur(80px)` em verde translúcido para profundidade.

## Padrão de Card (Glassmorphism)
```css
background: rgba(255,255,255,0.85);
backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,0.5);
border-radius: 18px;
box-shadow: [card-shadow];
```

## Classes CSS Principais

| Classe             | Uso                                      |
|--------------------|-------------------------------------------|
| `.auth-card`       | Card glassmorphico de auth/dashboard      |
| `.btn-primary`     | Botão principal com gradiente verde       |
| `.input-wrapper`   | Wrapper de input com ícone à esquerda     |
| `.error-alert`     | Caixa de erro vermelho                    |
| `.spinner`         | Spinner de carregamento animado           |
| `.form-group`      | Grupo de campo (label + input + hint)     |
| `.dashboard-stats` | Grid de estatísticas do dashboard         |
| `.avatar`          | Avatar circular com iniciais do usuário   |
| `.animate-fade-in` | Animação de entrada suave                 |
