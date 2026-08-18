# Estrutura de Arquivos — Nutricionistas-SOS

```
Nutricionistas-SOS/
├── _prompt/                    # Contexto do projeto para IA
│   ├── projeto.md              # Visão geral, stack e status
│   ├── estrutura.md            # Este arquivo — mapa de arquivos
│   ├── design.md               # Tokens de design, cores, componentes CSS
│   └── regras-de-negocio.md    # Fluxos, validações e regras da aplicação
│
├── public/                     # Ativos estáticos
├── src/
│   ├── assets/                 # Imagens e recursos internos
│   ├── components/
│   │   ├── Login.jsx           # Formulário de login
│   │   ├── Register.jsx        # Formulário de cadastro (nutricionista)
│   │   ├── Dashboard.jsx       # Painel pós-login com stats
│   │   └── Logo.jsx            # Componente de logo reutilizável
│   ├── services/
│   │   └── auth.js             # signUp, signIn, getSession, signOut
│   ├── App.jsx                 # Roteamento de views (login/register/dashboard)
│   ├── App.css                 # Estilos globais e componentes
│   ├── index.css               # CSS reset e design tokens (variáveis CSS)
│   └── main.jsx                # Entry point React
│
├── index.html                  # HTML raiz
├── vite.config.js              # Configuração Vite
├── package.json
├── .env                        # Variáveis de ambiente (não commitado)
└── .gitignore
```

## Componentes Principais

### `App.jsx`
- Gerencia estado global: `currentUser`, `currentView` (`login` | `register` | `dashboard`)
- Verifica sessão no `localStorage` ao inicializar
- Rota para os 3 views com base no estado

### `src/services/auth.js`
- `signUp({ nome, email, senha })` → registra no Neon Auth + insere na tabela `nutricionistas`
- `signIn({ email, senha })` → autentica e salva sessão
- `getSession()` → lê sessão do `localStorage`
- `signOut()` → remove sessão do `localStorage`
