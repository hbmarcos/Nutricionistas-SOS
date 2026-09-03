import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Schema estruturado para retorno estrito do Gemini
 */
const MEAL_PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    plano_semanal: {
      type: SchemaType.ARRAY,
      description: 'Lista contendo os 7 dias da semana com suas respectivas refeições.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          dia: {
            type: SchemaType.STRING,
            description: 'Nome do dia da semana (ex: Segunda-feira, Terça-feira, etc.)'
          },
          refeicoes: {
            type: SchemaType.OBJECT,
            properties: {
              cafe_da_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções saudáveis e práticas para o café da manhã.'
              },
              lanche_manha: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções de lanches leves matinais.'
              },
              almoco: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções completas para o almoço.'
              },
              lanche_tarde: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções nutritivas para o lanche da tarde.'
              },
              jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '5 opções equilibradas para o jantar.'
              },
              restaurantes_jantar: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: '3 opções de restaurantes na cidade do paciente com pratos saudáveis para o jantar.'
              }
            },
            required: ['cafe_da_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'restaurantes_jantar']
          }
        },
        required: ['dia', 'refeicoes']
      }
    }
  },
  required: ['plano_semanal']
};

/**
 * Monta a descrição detalhada dos dados do paciente para o prompt
 */
export function formatPatientDataForPrompt(paciente) {
  if (!paciente) return 'Sem dados informados.';

  const partes = [];
  if (paciente.nome) partes.push(`Nome: ${paciente.nome}`);
  if (paciente.sexo) partes.push(`Sexo: ${paciente.sexo}`);
  if (paciente.data_nascimento) partes.push(`Data de Nascimento: ${paciente.data_nascimento}`);
  if (paciente.cidade) partes.push(`Cidade do Paciente: ${paciente.cidade}`);
  if (paciente.pais) partes.push(`País de Origem: ${paciente.pais}`);
  if (paciente.peso_inicial) partes.push(`Peso Atual/Inicial: ${paciente.peso_inicial} kg`);
  if (paciente.altura) partes.push(`Altura: ${paciente.altura} cm`);

  // Objetivos
  const objetivos = [];
  if (Array.isArray(paciente.objetivos) && paciente.objetivos.length > 0) {
    objetivos.push(...paciente.objetivos);
  }
  if (paciente.objetivo_texto) {
    objetivos.push(paciente.objetivo_texto);
  }
  partes.push(`Objetivos Clínicos: ${objetivos.length > 0 ? objetivos.join(', ') : 'Manutenção de saúde e bem-estar'}`);

  // Restrições e Alergias
  const restricoes = Array.isArray(paciente.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0
    ? paciente.restricoes_alimentares.join(', ')
    : 'Nenhuma restrição declarada';
  partes.push(`Restrições Alimentares: ${restricoes}`);

  const alergias = Array.isArray(paciente.alergias) && paciente.alergias.length > 0
    ? paciente.alergias.join(', ')
    : 'Nenhuma alergia declarada';
  partes.push(`Alergias / Intolerâncias: ${alergias}`);

  // Patologias
  const patologias = Array.isArray(paciente.patologias) && paciente.patologias.length > 0
    ? paciente.patologias.join(', ')
    : 'Nenhuma patologia informada';
  partes.push(`Patologias / Condições de Saúde: ${patologias}`);

  // Hábitos e Rotina
  if (paciente.nivel_atividade) partes.push(`Nível de Atividade: ${paciente.nivel_atividade}`);
  if (paciente.atividade_fisica) {
    partes.push(`Pratica Atividade Física: Sim (${paciente.atividade_fisica_descricao || 'Não detalhada'})`);
  } else {
    partes.push(`Pratica Atividade Física: Não / Sedentário`);
  }

  if (paciente.refeicoes_por_dia) partes.push(`Refeições habituais por dia: ${paciente.refeicoes_por_dia}`);
  if (paciente.litros_agua) partes.push(`Consumo de água diário: ${paciente.litros_agua} L`);
  if (paciente.horario_acorda) partes.push(`Horário de acordar: ${paciente.horario_acorda}`);
  if (paciente.horario_dorme) partes.push(`Horário de dormir: ${paciente.horario_dorme}`);
  if (paciente.medicamentos) partes.push(`Medicamentos em uso: ${paciente.medicamentos}`);
  if (paciente.suplementos) partes.push(`Suplementação atual: ${paciente.suplementos}`);
  if (paciente.observacoes) partes.push(`Observações Clínicas Adicionais: ${paciente.observacoes}`);

  return partes.join('\n');
}

/**
 * Gera o plano alimentar utilizando o SDK do Google Gemini
 */
export async function generateMealPlanWithGemini(paciente, apiKey = process.env.GOOGLE_API_KEY) {
  if (!apiKey) {
    throw new Error('Chave GOOGLE_API_KEY não configurada no servidor.');
  }

  const dadosPacienteTexto = formatPatientDataForPrompt(paciente);

  const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteTexto}

# Regras Críticas de Execução:
- OBRIGATÓRIO E CRÍTICO: TODO O TEXTO DO PLANO ALIMENTAR (nomes de pratos, ingredientes, refeições e alimentos) DEVE SER ESTRITAMENTE ESCRITO EM PORTUGUÊS DO BRASIL (PT-BR). NUNCA responda em espanhol, inglês ou qualquer outro idioma, independentemente do país de origem ou cidade do paciente.
- Se o paciente estiver em um país de outro idioma (ex: Argentina, EUA, etc.), selecione alimentos e receitas disponíveis localmente, mas descreva-os SEMPRE utilizando os termos e nomes em PORTUGUÊS DO BRASIL (exemplo: use "Abacate" em vez de "Palta", "Torradas de pão integral com queijo" em vez de "Tostadas de pan integral con queso", "Mingau de aveia" em vez de "Porridge de avena").
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Adapte o cardápio e os ingredientes aos alimentos e hábitos disponíveis na Cidade (${paciente?.cidade || 'Não informada'}) e País de Origem (${paciente?.pais || 'Brasil'}) do paciente, mantendo toda a nomenclatura em Português do Brasil.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos.
- SOMENTE NO JANTAR: Inclua na chave "restaurantes_jantar" exatamente 3 sugestões de restaurantes reais/populares localizados na Cidade do paciente (${paciente?.cidade || 'Não informada'}), indicando em cada um o nome do estabelecimento e uma sugestão de prato saudável e leve para o jantar em Português do Brasil (ex: ["Restaurante Saúde & Sabor - Grelhado com salada verde", "Bistrô Natural - Sopa de legumes leve", "Restaurante Verde Vida - Peixe grelhado com purê de mandioquinha"]).

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "restaurantes_jantar": [
          "Restaurante 1 na cidade - Prato saudável para o jantar",
          "Restaurante 2 na cidade - Prato saudável para o jantar",
          "Restaurante 3 na cidade - Prato saudável para o jantar"
        ]
      }
    }
  ]
}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Modelos Gemini suportados (ordem de prioridade e fallback)
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;
  let rawText = '';

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Tenta cada modelo com até 2 retries em caso de 503 / alta demanda temporária
  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: MEAL_PLAN_SCHEMA,
            temperature: 0.7
          }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        rawText = response.text();
        if (rawText) {
          break; // Sucesso na geração
        }
      } catch (err) {
        console.warn(`[gerar-plano] Modelo ${modelName} (tentativa ${attempt}) falhou:`, err.message);
        lastError = err;
        if (attempt < 2) {
          await sleep(1500 * attempt);
        }
      }
    }

    if (rawText) {
      break;
    }
  }

  if (!rawText) {
    const errorMsg = lastError?.message || '';
    if (errorMsg.includes('503') || errorMsg.includes('high demand')) {
      throw new Error('Os servidores da IA do Google estão temporariamente sobrecarregados. Por favor, aguarde alguns instantes e clique em "Tentar Novamente" ou crie um Plano Manual.');
    }
    throw new Error(lastError ? `Falha ao gerar plano com Gemini: ${lastError.message}` : 'Resposta vazia da IA.');
  }

  // Parse com try/catch e sanitização de segurança
  try {
    let cleanJson = rawText.trim();
    // Remove blocos de markdown caso a IA inclua
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    if (!parsed || !Array.isArray(parsed.plano_semanal)) {
      throw new Error('Formato do JSON gerado não contém a chave "plano_semanal" esperada.');
    }
    return parsed;
  } catch (parseError) {
    console.error('[gerar-plano] Erro ao fazer JSON.parse do texto retornado:', rawText);
    throw new Error(`Erro ao interpretar resposta da IA: ${parseError.message}`);
  }
}

/**
 * Serverless function handler padrão Vercel
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const paciente = body?.paciente || body;
    if (!paciente) {
      return res.status(400).json({ error: 'Dados do paciente não informados no corpo da requisição.' });
    }

    const plano = await generateMealPlanWithGemini(paciente);
    return res.status(200).json({
      success: true,
      data: plano
    });
  } catch (error) {
    console.error('[API /api/gerar-plano] Erro na execução:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao gerar o plano alimentar com IA.'
    });
  }
}
