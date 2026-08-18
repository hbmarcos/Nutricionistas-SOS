# Regras de Negócio — Nutricionistas-SOS

## Usuários
- Apenas **nutricionistas** podem se cadastrar
- Campos obrigatórios no cadastro: `nome completo`, `e-mail`, `senha`
- E-mail deve ser único no sistema

## Validações de Cadastro (`signUp`)

| Campo  | Regra                                      |
|--------|--------------------------------------------|
| Nome   | Não pode ser vazio ou só espaços           |
| E-mail | Deve conter `@`                            |
| Senha  | Mínimo de **9 caracteres**                 |

## Validações de Login (`signIn`)

| Campo  | Regra                    |
|--------|--------------------------|
| E-mail | Deve conter `@`          |
| Senha  | Não pode ser vazia       |

## Fluxo de Autenticação

```
[Usuário] → Preenche formulário
         → Clica em "Cadastrar" / "Entrar"
         → Valida campos no frontend
         → POST para Neon Auth URL
         → Recebe { user, token }
         → Salva sessão no localStorage (chave: 'nutri_sos_session')
         → Redireciona para Dashboard
```

## Sessão
- Sessão armazenada no `localStorage` com a chave `nutri_sos_session`
- Estrutura da sessão:
  ```json
  {
    "user": { "id": "...", "nome": "...", "email": "..." },
    "token": "...",
    "loggedInAt": "2026-01-01T00:00:00.000Z"
  }
  ```
- Ao abrir o app, verifica se há sessão válida e redireciona para o Dashboard
- Logout remove a chave do `localStorage`

## Registro no Banco de Dados
- Após o cadastro no Neon Auth, tenta inserir o nutricionista na tabela `nutricionistas`
- Esta inserção é feita **em background** (não bloqueia o fluxo do usuário)
- Usa a variável `VITE_NEON_DATA_API_URL` para acessar a Data API REST
- Se falhar, apenas loga um `console.warn` (não exibe erro ao usuário)
- Header: `Prefer: return=minimal,resolution=merge-duplicates` (upsert seguro)

## Dashboard (Estado Atual)
- Exibe nome e e-mail do usuário logado
- Mostra 3 contadores zerados: **Pacientes**, **Consultas**, **Planos**
- Funcionalidades futuras a implementar:
  - Cadastro e listagem de pacientes
  - Agendamento de consultas
  - Criação de planos alimentares
  - Gráficos de evolução dos pacientes

## Tabela `nutricionistas` (Neon DB)
- Campos esperados: `nome`, `email`
- Chave única: `email`
