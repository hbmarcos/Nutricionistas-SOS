import { neon } from '@neondatabase/serverless';

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-bitter-salad-aclfu4ys.neonauth.sa-east-1.aws.neon.tech/neondb/auth';
const SESSION_KEY = 'nutri_sos_session';

/**
 * Insere o nutricionista na tabela 'nutricionistas' via @neondatabase/serverless.
 * Roda em background após o cadastro no Neon Auth.
 */
async function salvarNutricionistaNoBanco(nome, email) {
  try {
    const dbUrl = import.meta.env.VITE_NEON_DATABASE_URL;
    if (!dbUrl) {
      console.warn('[Nutricionistas-SOS] VITE_NEON_DATABASE_URL não configurada.');
      return;
    }
    const sql = neon(dbUrl, { disableWarningInBrowsers: true });
    await sql`
      INSERT INTO nutricionistas (nome, email)
      VALUES (${nome.trim()}, ${email.trim()})
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('[Nutricionistas-SOS] Nutricionista salvo no banco com sucesso.');
  } catch (e) {
    console.warn('[Nutricionistas-SOS] Inserção no banco em background falhou:', e.message);
  }
}

/**
 * Registra um novo nutricionista no Neon Auth e salva na tabela 'nutricionistas'
 */
export async function signUp({ nome, email, senha }) {
  if (!nome || !nome.trim()) {
    throw new Error('Por favor, informe seu nome completo.');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Por favor, informe um e-mail válido.');
  }
  if (!senha || senha.length < 9) {
    throw new Error('A senha deve ter no mínimo 9 caracteres.');
  }

  const res = await fetch(`${AUTH_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password: senha,
      name: nome.trim(),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = (data?.message || '').toLowerCase();
    if (msg.includes('already') || msg.includes('exists') || msg.includes('duplicate')) {
      throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
    }
    throw new Error('Não foi possível criar a conta. Verifique seus dados e tente novamente.');
  }

  const sessionData = {
    user: {
      id: data.user?.id,
      nome: data.user?.name || nome.trim(),
      email: data.user?.email || email.trim(),
    },
    token: data.token,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

  // Registra no banco em background (não bloqueia o fluxo)
  salvarNutricionistaNoBanco(nome, email, data.token);

  return sessionData.user;
}

/**
 * Autentica um nutricionista existente
 */
export async function signIn({ email, senha }) {
  if (!email || !email.includes('@')) {
    throw new Error('Por favor, informe um e-mail válido.');
  }
  if (!senha) {
    throw new Error('Por favor, informe sua senha.');
  }

  let res;
  try {
    res = await fetch(`${AUTH_URL}/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password: senha,
      }),
    });
  } catch {
    throw new Error('Falha de conexão com o servidor de autenticação. Verifique sua internet.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || 'E-mail ou senha incorretos. Verifique suas credenciais.';
    throw new Error(errorMsg);
  }

  const sessionData = {
    user: {
      id: data.user?.id,
      nome: data.user?.name || email.split('@')[0],
      email: data.user?.email || email.trim(),
    },
    token: data.token,
    loggedInAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  return sessionData.user;
}

/**
 * Retorna a sessão ativa armazenada no navegador
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Encerra a sessão atual do nutricionista
 */
export function signOut() {
  localStorage.removeItem(SESSION_KEY);
}
