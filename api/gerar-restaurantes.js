import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Schema estruturado para retorno das sugestões de restaurantes
 */
const RESTAURANTS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    restaurantes: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Lista com exatamente 3 sugestões de restaurantes na cidade do paciente com pratos saudáveis para o jantar.'
    }
  },
  required: ['restaurantes']
};

/**
 * Função utilitária para gerar sugestões de restaurantes via Gemini SDK
 */
export async function generateRestaurantsWithGemini(paciente, apiKey = process.env.GOOGLE_API_KEY) {
  if (!apiKey) {
    throw new Error('Chave GOOGLE_API_KEY não configurada no servidor.');
  }

  const cidade = paciente?.cidade || 'Porto Alegre - RS';
  const restricoes = Array.isArray(paciente?.restricoes_alimentares) && paciente.restricoes_alimentares.length > 0
    ? paciente.restricoes_alimentares.join(', ')
    : 'Nenhuma';
  const alergias = Array.isArray(paciente?.alergias) && paciente.alergias.length > 0
    ? paciente.alergias.join(', ')
    : 'Nenhuma';

  const prompt = `Você é um guia gastronômico e nutricionista especializado na culinária brasileira.
Indique EXATAMENTE 3 restaurantes reais, populares ou bem avaliados localizados na cidade ou região de "${cidade}".
Para cada restaurante, sugira um prato saudável, leve e nutritivo adequado para o jantar de um paciente com as seguintes restrições:
- Restrições Alimentares: ${restricoes}
- Alergias / Intolerâncias: ${alergias}

# Formato das opções:
Retorne no formato: "Nome do Restaurante - Prato Saudável Recomendado para o Jantar"
Exemplo:
["Prato Verde - Filé de peixe grelhado com purê de mandioquinha e salada verde", "Bistrô Health - Salada morna de quinoa com cogumelos e legumes", "Restaurante Naturalis - Omelete de claras com espinafre e brotos"]

Regras:
- TODO O TEXTO DEVE SER ESTRITAMENTE EM PORTUGUÊS DO BRASIL (PT-BR).
- Responda APENAS o JSON no schema solicitado.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let rawText = '';
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESTAURANTS_SCHEMA,
          temperature: 0.7
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      rawText = response.text();
      if (rawText) break;
    } catch (err) {
      lastError = err;
      console.warn(`[gerar-restaurantes] Erro com ${modelName}:`, err.message);
    }
  }

  if (!rawText) {
    throw lastError || new Error('Não foi possível indicar os restaurantes.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Erro ao decodificar a resposta dos restaurantes.');
    }
  }

  return parsed.restaurantes || [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido.' });
  }

  try {
    const { paciente } = req.body || {};
    const apiKey = process.env.GOOGLE_API_KEY;

    const data = await generateRestaurantsWithGemini(paciente, apiKey);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erro na API gerar-restaurantes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno ao gerar restaurantes com IA.'
    });
  }
}
