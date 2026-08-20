import { neon } from '@neondatabase/serverless';

const DB_URL = import.meta.env.VITE_NEON_DATABASE_URL;
const LOCAL_STORAGE_KEY = 'nutri_sos_patients_cache';
const LOCAL_STORAGE_CONSULTAS_KEY = 'nutri_sos_consultas_cache';
const LOCAL_STORAGE_PLANOS_KEY = 'nutri_sos_planos_cache';

/**
 * Retorna o sql client do Neon caso a URL esteja configurada
 */
function getSqlClient() {
  if (!DB_URL) {
    console.warn('[Nutricionistas-SOS] VITE_NEON_DATABASE_URL não configurada.');
    return null;
  }
  return neon(DB_URL);
}

/**
 * Auxiliar para obter a lista local de pacientes em cache
 */
function getLocalPatients() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Auxiliar para salvar pacientes no cache local
 */
function saveLocalPatients(patients) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.warn('Erro ao salvar pacientes no cache local:', e);
  }
}

/**
 * Auxiliares para cache de consultas
 */
function getLocalConsultas(patientId) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONSULTAS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter(c => c.paciente_id === patientId || String(c.paciente_id) === String(patientId));
  } catch {
    return [];
  }
}

function saveLocalConsulta(newConsulta) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONSULTAS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    localStorage.setItem(LOCAL_STORAGE_CONSULTAS_KEY, JSON.stringify([newConsulta, ...all]));
  } catch (e) {
    console.warn('Erro ao salvar consulta local:', e);
  }
}

/**
 * Auxiliares para cache de planos alimentares
 */
function getLocalPlanos(patientId) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLANOS_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter(p => p.paciente_id === patientId || String(p.paciente_id) === String(patientId));
  } catch {
    return [];
  }
}

/**
 * Busca o ID (UUID) do nutricionista pelo e-mail na tabela 'nutricionistas'.
 */
export async function getNutricionistaDbId(userEmail, userName = '') {
  if (!userEmail) return null;
  const sql = getSqlClient();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id FROM nutricionistas WHERE email = ${userEmail.trim()} LIMIT 1;
    `;
    if (rows && rows.length > 0) {
      return rows[0].id;
    }

    const inserted = await sql`
      INSERT INTO nutricionistas (nome, email)
      VALUES (${userName || userEmail.split('@')[0]}, ${userEmail.trim()})
      ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id;
    `;
    return inserted[0]?.id || null;
  } catch (e) {
    console.warn('[patients.js] Erro ao buscar ID do nutricionista no banco:', e.message);
    return null;
  }
}

/**
 * Busca todos os pacientes de um nutricionista
 */
export async function fetchPatients(userEmail, _userId = null) {
  const sql = getSqlClient();
  let nutricionistaUuid = null;

  if (sql && userEmail) {
    try {
      nutricionistaUuid = await getNutricionistaDbId(userEmail);
      let query;
      if (nutricionistaUuid) {
        query = await sql`
          SELECT * FROM pacientes 
          WHERE nutricionista_id = ${nutricionistaUuid}
          ORDER BY created_at DESC;
        `;
      } else {
        query = await sql`
          SELECT * FROM pacientes 
          ORDER BY created_at DESC;
        `;
      }
      if (query) {
        saveLocalPatients(query);
        return query;
      }
    } catch (e) {
      console.warn('[patients.js] Falha ao buscar pacientes do banco Neon, usando cache:', e.message);
    }
  }

  const local = getLocalPatients();
  return local.filter(p => !userEmail || p.user_email === userEmail || p.nutricionista_id === nutricionistaUuid);
}

/**
 * Busca dados de um paciente específico pelo ID
 */
export async function fetchPatientById(patientId) {
  if (!patientId) return null;
  const sql = getSqlClient();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM pacientes WHERE id = ${patientId} LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (e) {
      console.warn('[patients.js] Erro ao buscar paciente por ID no banco Neon:', e.message);
    }
  }

  const local = getLocalPatients();
  return local.find(p => p.id === patientId || String(p.id) === String(patientId)) || null;
}

/**
 * Cadastra um novo paciente no Neon DB
 */
export async function createPatient(patientData, userEmail, userName) {
  if (!patientData.nome || !patientData.nome.trim()) {
    throw new Error('O nome completo do paciente é obrigatório.');
  }

  const sql = getSqlClient();
  let nutricionistaUuid = null;

  if (sql && userEmail) {
    try {
      nutricionistaUuid = await getNutricionistaDbId(userEmail, userName);
    } catch (e) {
      console.warn('[patients.js] Não foi possível obter UUID do nutricionista:', e.message);
    }
  }

  const cleanData = {
    nutricionista_id: nutricionistaUuid,
    nome: patientData.nome.trim(),
    data_nascimento: patientData.data_nascimento || null,
    sexo: patientData.sexo || null,
    telefone: patientData.telefone || null,
    whatsapp: patientData.whatsapp || null,
    email: patientData.email || null,
    peso_inicial: patientData.peso_inicial ? parseFloat(patientData.peso_inicial) : null,
    altura: patientData.altura ? parseFloat(patientData.altura) : null,
    objetivos: Array.isArray(patientData.objetivos) ? patientData.objetivos : [],
    objetivo_texto: patientData.objetivo_texto || null,
    nivel_atividade: patientData.nivel_atividade || null,
    patologias: Array.isArray(patientData.patologias) ? patientData.patologias : [],
    restricoes_alimentares: Array.isArray(patientData.restricoes_alimentares) ? patientData.restricoes_alimentares : [],
    alergias: Array.isArray(patientData.alergias) ? patientData.alergias : [],
    medicamentos: patientData.medicamentos || null,
    suplementos: patientData.suplementos || null,
    refeicoes_por_dia: patientData.refeicoes_por_dia ? parseInt(patientData.refeicoes_por_dia, 10) : null,
    horario_acorda: patientData.horario_acorda || null,
    horario_dorme: patientData.horario_dorme || null,
    litros_agua: patientData.litros_agua ? parseFloat(patientData.litros_agua) : null,
    atividade_fisica: Boolean(patientData.atividade_fisica),
    atividade_fisica_descricao: patientData.atividade_fisica_descricao || null,
    observacoes: patientData.observacoes || null,
    data_ultima_consulta: null,
    created_at: new Date().toISOString()
  };

  let newRecord = null;

  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO pacientes (
          nutricionista_id, nome, data_nascimento, sexo, telefone, whatsapp, email,
          peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
          patologias, restricoes_alimentares, alergias, medicamentos, suplementos,
          refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
          atividade_fisica, atividade_fisica_descricao, observacoes, data_ultima_consulta
        ) VALUES (
          ${cleanData.nutricionista_id},
          ${cleanData.nome},
          ${cleanData.data_nascimento},
          ${cleanData.sexo},
          ${cleanData.telefone},
          ${cleanData.whatsapp},
          ${cleanData.email},
          ${cleanData.peso_inicial},
          ${cleanData.altura},
          ${cleanData.objetivos},
          ${cleanData.objetivo_texto},
          ${cleanData.nivel_atividade},
          ${cleanData.patologias},
          ${cleanData.restricoes_alimentares},
          ${cleanData.alergias},
          ${cleanData.medicamentos},
          ${cleanData.suplementos},
          ${cleanData.refeicoes_por_dia},
          ${cleanData.horario_acorda},
          ${cleanData.horario_dorme},
          ${cleanData.litros_agua},
          ${cleanData.atividade_fisica},
          ${cleanData.atividade_fisica_descricao},
          ${cleanData.observacoes},
          ${cleanData.data_ultima_consulta}
        )
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        newRecord = rows[0];
      }
    } catch (e) {
      console.warn('[patients.js] Erro ao inserir paciente no Neon DB, usando local:', e.message);
    }
  }

  if (!newRecord) {
    newRecord = {
      ...cleanData,
      id: 'local_' + Date.now(),
      user_email: userEmail
    };
  }

  const currentList = getLocalPatients();
  saveLocalPatients([newRecord, ...currentList]);

  return newRecord;
}

/**
 * Atualiza dados de um paciente existente no Neon DB
 */
export async function updatePatient(patientId, patientData) {
  if (!patientId) throw new Error('ID do paciente não informado.');
  if (!patientData.nome || !patientData.nome.trim()) {
    throw new Error('O nome completo é obrigatório.');
  }

  const cleanData = {
    nome: patientData.nome.trim(),
    data_nascimento: patientData.data_nascimento || null,
    sexo: patientData.sexo || null,
    telefone: patientData.telefone || null,
    whatsapp: patientData.whatsapp || null,
    email: patientData.email || null,
    peso_inicial: patientData.peso_inicial ? parseFloat(patientData.peso_inicial) : null,
    altura: patientData.altura ? parseFloat(patientData.altura) : null,
    objetivos: Array.isArray(patientData.objetivos) ? patientData.objetivos : [],
    objetivo_texto: patientData.objetivo_texto || null,
    nivel_atividade: patientData.nivel_atividade || null,
    patologias: Array.isArray(patientData.patologias) ? patientData.patologias : [],
    restricoes_alimentares: Array.isArray(patientData.restricoes_alimentares) ? patientData.restricoes_alimentares : [],
    alergias: Array.isArray(patientData.alergias) ? patientData.alergias : [],
    medicamentos: patientData.medicamentos || null,
    suplementos: patientData.suplementos || null,
    refeicoes_por_dia: patientData.refeicoes_por_dia ? parseInt(patientData.refeicoes_por_dia, 10) : null,
    horario_acorda: patientData.horario_acorda || null,
    horario_dorme: patientData.horario_dorme || null,
    litros_agua: patientData.litros_agua ? parseFloat(patientData.litros_agua) : null,
    atividade_fisica: Boolean(patientData.atividade_fisica),
    atividade_fisica_descricao: patientData.atividade_fisica_descricao || null,
    observacoes: patientData.observacoes || null
  };

  const sql = getSqlClient();
  let updatedRecord = null;

  if (sql) {
    try {
      const rows = await sql`
        UPDATE pacientes SET
          nome = ${cleanData.nome},
          data_nascimento = ${cleanData.data_nascimento},
          sexo = ${cleanData.sexo},
          telefone = ${cleanData.telefone},
          whatsapp = ${cleanData.whatsapp},
          email = ${cleanData.email},
          peso_inicial = ${cleanData.peso_inicial},
          altura = ${cleanData.altura},
          objetivos = ${cleanData.objetivos},
          objetivo_texto = ${cleanData.objetivo_texto},
          nivel_atividade = ${cleanData.nivel_atividade},
          patologias = ${cleanData.patologias},
          restricoes_alimentares = ${cleanData.restricoes_alimentares},
          alergias = ${cleanData.alergias},
          medicamentos = ${cleanData.medicamentos},
          suplementos = ${cleanData.suplementos},
          refeicoes_por_dia = ${cleanData.refeicoes_por_dia},
          horario_acorda = ${cleanData.horario_acorda},
          horario_dorme = ${cleanData.horario_dorme},
          litros_agua = ${cleanData.litros_agua},
          atividade_fisica = ${cleanData.atividade_fisica},
          atividade_fisica_descricao = ${cleanData.atividade_fisica_descricao},
          observacoes = ${cleanData.observacoes}
        WHERE id = ${patientId}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        updatedRecord = rows[0];
      }
    } catch (e) {
      console.warn('[patients.js] Erro ao atualizar paciente no Neon DB, usando local:', e.message);
    }
  }

  // Fallback cache local
  const currentList = getLocalPatients();
  const updatedList = currentList.map(p => {
    if (p.id === patientId || String(p.id) === String(patientId)) {
      return { ...p, ...cleanData };
    }
    return p;
  });
  saveLocalPatients(updatedList);

  if (!updatedRecord) {
    updatedRecord = updatedList.find(p => p.id === patientId || String(p.id) === String(patientId)) || { id: patientId, ...cleanData };
  }

  return updatedRecord;
}

/**
 * Busca todas as consultas registradas de um paciente
 */
export async function fetchConsultas(patientId) {
  if (!patientId) return [];
  const sql = getSqlClient();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM consultas
        WHERE paciente_id = ${patientId}
        ORDER BY data_consulta DESC, created_at DESC;
      `;
      if (rows) return rows;
    } catch (e) {
      console.warn('[patients.js] Erro ao buscar consultas no Neon DB:', e.message);
    }
  }

  return getLocalConsultas(patientId);
}

/**
 * Cadastra uma nova consulta para o paciente no Neon DB
 */
export async function createConsulta(patientId, consultaData) {
  if (!patientId) throw new Error('ID do paciente não informado.');
  if (!consultaData.peso) throw new Error('O peso atual é obrigatório.');

  const cleanData = {
    paciente_id: patientId,
    data_consulta: consultaData.data_consulta || new Date().toISOString().split('T')[0],
    peso: parseFloat(consultaData.peso),
    cintura: consultaData.cintura ? parseFloat(consultaData.cintura) : null,
    quadril: consultaData.quadril ? parseFloat(consultaData.quadril) : null,
    percentual_gordura: consultaData.percentual_gordura ? parseFloat(consultaData.percentual_gordura) : null,
    observacoes: consultaData.observacoes || null,
    proximo_retorno: consultaData.proximo_retorno || null,
    created_at: new Date().toISOString()
  };

  const sql = getSqlClient();
  let newRecord = null;

  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO consultas (
          paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura, observacoes, proximo_retorno
        ) VALUES (
          ${cleanData.paciente_id},
          ${cleanData.data_consulta},
          ${cleanData.peso},
          ${cleanData.cintura},
          ${cleanData.quadril},
          ${cleanData.percentual_gordura},
          ${cleanData.observacoes},
          ${cleanData.proximo_retorno}
        )
        RETURNING *;
      `;

      if (rows && rows.length > 0) {
        newRecord = rows[0];

        // Atualiza a data da última consulta e o peso atual na tabela pacientes
        await sql`
          UPDATE pacientes SET
            data_ultima_consulta = ${cleanData.data_consulta},
            peso_inicial = ${cleanData.peso}
          WHERE id = ${patientId};
        `;
      }
    } catch (e) {
      console.warn('[patients.js] Erro ao cadastrar consulta no Neon DB, usando local:', e.message);
    }
  }

  if (!newRecord) {
    newRecord = {
      ...cleanData,
      id: 'local_c_' + Date.now()
    };
    saveLocalConsulta(newRecord);

    // Atualiza paciente localmente
    const currentList = getLocalPatients();
    const updatedList = currentList.map(p => {
      if (p.id === patientId || String(p.id) === String(patientId)) {
        return {
          ...p,
          data_ultima_consulta: cleanData.data_consulta,
          peso_inicial: cleanData.peso
        };
      }
      return p;
    });
    saveLocalPatients(updatedList);
  }

  return newRecord;
}

/**
 * Busca planos alimentares do paciente
 */
export async function fetchPlanosAlimentares(patientId) {
  if (!patientId) return [];
  const sql = getSqlClient();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM planos_alimentares
        WHERE paciente_id = ${patientId}
        ORDER BY created_at DESC;
      `;
      if (rows) return rows;
    } catch (e) {
      console.warn('[patients.js] Erro ao buscar planos alimentares no Neon DB:', e.message);
    }
  }

  return getLocalPlanos(patientId);
}
