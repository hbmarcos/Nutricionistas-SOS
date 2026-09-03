import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Schema estruturado para retorno da Receita
 */
const RECIPE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    titulo: {
      type: SchemaType.STRING,
      description: 'Título da receita em Português do Brasil.'
    },
    tempo_preparo: {
      type: SchemaType.STRING,
      description: 'Tempo estimado de preparo (ex: 15 minutos).'
    },
    dificuldade: {
      type: SchemaType.STRING,
      description: 'Nível de dificuldade (ex: Fácil, Médio, Avançado).'
    },
    rendimento: {
      type: SchemaType.STRING,
      description: 'Rendimento da receita (ex: 1 porção, 2 porções).'
    },
    calorias_estimadas: {
      type: SchemaType.STRING,
      description: 'Estimativa calórica por porção (ex: 250 kcal).'
    },
    ingredientes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Lista de ingredientes com quantidades em Português do Brasil.'
    },
    modo_preparo: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Passo a passo numerado e claro de preparo.'
    },
    dica_nutricionista: {
      type: SchemaType.STRING,
      description: 'Dica nutricional ou substituição saudável prática.'
    }
  },
  required: ['titulo', 'tempo_preparo', 'dificuldade', 'rendimento', 'ingredientes', 'modo_preparo', 'dica_nutricionista']
};

/**
 * Função utilitária para gerar a receita via Gemini SDK
 */
export async function generateRecipeWithGemini(prato, paciente, apiKey = process.env.GOOGLE_API_KEY) {
  if (!prato || !prato.trim()) {
    throw new Error('Nome do prato não informado.');
  }

  if (!apiKey) {
    throw new Error('Chave GOOGLE_API_KEY não configurada no servidor.');
  }

  const restricoes = Array.isArray(paciente?.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0
    ? paciente.restricoes_alimentares.join(', ')
    : 'Nenhuma';
  const alergias = Array.isArray(paciente?.alergias) && paciente.alergias.length > 0
    ? paciente.alergias.join(', ')
    : 'Nenhuma';

  const prompt = `Você é um chef e nutricionista profissional.
Gere uma receita prática, deliciosa e saudável em Português do Brasil para o seguinte prato/opção de refeição:
"${prato.trim()}"

Dados de saúde do paciente para adequação:
- Restrições alimentares: ${restricoes}
- Alergias / Intolerâncias: ${alergias}
- Cidade / Local: ${paciente?.cidade || 'Não informada'} (${paciente?.pais || 'Brasil'})

# Regras Críticas de Execução:
- OBRIGATÓRIO: TODO O TEXTO DEVE SER ESTRITAMENTE ESCRITO EM PORTUGUÊS DO BRASIL (PT-BR). NUNCA responda em espanhol, inglês ou outro idioma.
- Garanta que os ingredientes respeitem rigorosamente quaisquer alergias ou restrições do paciente.
- O passo a passo deve ser simples, prático e rápido para o dia a dia.
- Responda APENAS o JSON no schema solicitado.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash'];
  let rawText = '';
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RECIPE_SCHEMA,
          temperature: 0.7
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      rawText = response.text();
      if (rawText) break;
    } catch (err) {
      lastError = err;
      console.warn(`[gerar-receita] Erro com ${modelName}:`, err.message);
    }
  }

  if (!rawText) {
    throw lastError || new Error('Não foi possível gerar a receita.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Erro ao decodificar a resposta da IA.');
    }
  }

  return parsed;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  try {
    const { prato, paciente } = req.body || {};
    const apiKey = process.env.GOOGLE_API_KEY;

    const data = await generateRecipeWithGemini(prato, paciente, apiKey);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro na API gerar-receita:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao gerar receita com IA.'
    });
  }
}
