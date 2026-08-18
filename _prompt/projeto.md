# Nutricionistas-SOS — Contexto do Projeto

## Visão Geral
**Nutricionistas-SOS** é uma aplicação web para nutricionistas gerenciarem sua prática profissional.
Permite cadastro, login e acesso a um painel de controle com métricas de pacientes, consultas e planos alimentares.

## Stack Tecnológica

| Camada       | Tecnologia                          |
|--------------|--------------------------------------|
| Frontend     | React 19 + Vite 8                   |
| Estilização  | CSS Vanilla (glassmorphism, tokens) |
| Banco de dados | Neon (PostgreSQL serverless)      |
| Autenticação | Neon Auth (email/senha)             |
| Ícones       | Lucide React                        |
| Linter       | OxLint                              |

## Variáveis de Ambiente (`.env`)

```env
VITE_NEON_AUTH_URL=https://ep-bitter-salad-aclfu4ys.neonauth.sa-east-1.aws.neon.tech/neondb/auth
VITE_NEON_DATABASE_URL=postgresql://neondb_owner:...@ep-bitter-salad-aclfu4ys.sa-east-1.aws.neon.tech/neondb?sslmode=require
VITE_NEON_DATA_API_URL=  # opcional — para inserção direta via REST
```

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento (Vite HMR)
npm run build    # Build de produção
npm run preview  # Prévia do build
npm run lint     # OxLint
```

## Estado Atual

- ✅ Autenticação completa (cadastro + login + logout)
- ✅ Sessão persistida no `localStorage`
- ✅ Dashboard com boas-vindas e stats (zerados)
- ⬜ CRUD de pacientes
- ⬜ Agendamento de consultas
- ⬜ Planos alimentares
- ⬜ Integração total com banco Neon via Data API
