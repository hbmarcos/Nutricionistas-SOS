/**
 * Mapeamento de cidades populares e seus respectivos países de origem.
 */
const CITY_TO_COUNTRY = {
  // Brasil - Capitais e principais cidades
  'são paulo': 'Brasil',
  'rio de janeiro': 'Brasil',
  'belo horizonte': 'Brasil',
  'salvador': 'Brasil',
  'brasília': 'Brasil',
  'fortaleza': 'Brasil',
  'curitiba': 'Brasil',
  'manaus': 'Brasil',
  'recife': 'Brasil',
  'porto alegre': 'Brasil',
  'belém': 'Brasil',
  'goiânia': 'Brasil',
  'guarulhos': 'Brasil',
  'campinas': 'Brasil',
  'são luís': 'Brasil',
  'são gonçalo': 'Brasil',
  'maceió': 'Brasil',
  'duque de caxias': 'Brasil',
  'natal': 'Brasil',
  'teresina': 'Brasil',
  'são bernardo do campo': 'Brasil',
  'campo grande': 'Brasil',
  'osasco': 'Brasil',
  'santo andré': 'Brasil',
  'joão pessoa': 'Brasil',
  'jaboatão dos guararapes': 'Brasil',
  'são josé dos campos': 'Brasil',
  'uberlândia': 'Brasil',
  'contagem': 'Brasil',
  'sorocaba': 'Brasil',
  'ribeirão preto': 'Brasil',
  'cuiabá': 'Brasil',
  'feira de santana': 'Brasil',
  'aracaju': 'Brasil',
  'joinville': 'Brasil',
  'londrina': 'Brasil',
  'niterói': 'Brasil',
  'juiz de fora': 'Brasil',
  'caxias do sul': 'Brasil',
  'florianópolis': 'Brasil',
  'macapá': 'Brasil',
  'santos': 'Brasil',
  'vila velha': 'Brasil',
  'serra': 'Brasil',
  'diadema': 'Brasil',
  'belford roxo': 'Brasil',
  'carapicuíba': 'Brasil',
  'palmas': 'Brasil',
  'boa vista': 'Brasil',
  'rio branco': 'Brasil',
  'porto velho': 'Brasil',
  'vitória': 'Brasil',

  // Portugal
  'lisboa': 'Portugal',
  'porto': 'Portugal',
  'coimbra': 'Portugal',
  'braga': 'Portugal',
  'faro': 'Portugal',
  'funchal': 'Portugal',
  'aveiro': 'Portugal',
  'setúbal': 'Portugal',

  // Angola & Moçambique
  'luanda': 'Angola',
  'benguela': 'Angola',
  'huambo': 'Angola',
  'maputo': 'Moçambique',
  'beira': 'Moçambique',

  // América Latina
  'buenos aires': 'Argentina',
  'córdoba': 'Argentina',
  'rosario': 'Argentina',
  'mendoza': 'Argentina',
  'santiago': 'Chile',
  'montevidéu': 'Uruguai',
  'montevideo': 'Uruguai',
  'assunção': 'Paraguai',
  'asunción': 'Paraguai',
  'lima': 'Peru',
  'cusco': 'Peru',
  'bogotá': 'Colômbia',
  'medellín': 'Colômbia',
  'cali': 'Colômbia',
  'caracas': 'Venezuela',
  'cidade do méxico': 'México',
  'guadalajara': 'México',
  'monterrey': 'México',

  // América do Norte & Europa
  'nova york': 'Estados Unidos',
  'new york': 'Estados Unidos',
  'miami': 'Estados Unidos',
  'orlando': 'Estados Unidos',
  'los angeles': 'Estados Unidos',
  'chicago': 'Estados Unidos',
  'boston': 'Estados Unidos',
  'toronto': 'Canadá',
  'vancouver': 'Canadá',
  'londres': 'Reino Unido',
  'london': 'Reino Unido',
  'paris': 'França',
  'lyon': 'França',
  'madrid': 'Espanha',
  'barcelona': 'Espanha',
  'roma': 'Itália',
  'milão': 'Itália',
  'milan': 'Itália',
  'berlim': 'Alemanha',
  'berlin': 'Alemanha',
  'tóquio': 'Japão',
  'tokyo': 'Japão',
  'pequim': 'China',
  'xangai': 'China',
  'sydney': 'Austrália'
};

/**
 * Sugestões de cidades para datalist
 */
export const COMMON_CITIES = [
  'São Paulo - SP, Brasil',
  'Rio de Janeiro - RJ, Brasil',
  'Belo Horizonte - MG, Brasil',
  'Brasília - DF, Brasil',
  'Salvador - BA, Brasil',
  'Fortaleza - CE, Brasil',
  'Curitiba - PR, Brasil',
  'Manaus - AM, Brasil',
  'Recife - PE, Brasil',
  'Porto Alegre - RS, Brasil',
  'Belém - PA, Brasil',
  'Goiânia - GO, Brasil',
  'Campinas - SP, Brasil',
  'Florianópolis - SC, Brasil',
  'Vitória - ES, Brasil',
  'Lisboa, Portugal',
  'Porto, Portugal',
  'Luanda, Angola',
  'Maputo, Moçambique',
  'Buenos Aires, Argentina',
  'Santiago, Chile',
  'Nova York, Estados Unidos',
  'Londres, Reino Unido',
  'Paris, França',
  'Madrid, Espanha'
];

/**
 * Remove acentos e converte para minúsculas para comparação flexível
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Infere e associa o país de origem a partir da cidade informada
 */
export function getCountryByCity(cityInput) {
  if (!cityInput || !cityInput.trim()) return '';

  const clean = normalizeText(cityInput);

  // Verifica padrões de estado brasileiro comuns como " - SP", "/RJ", " (MG)", etc.
  const brStates = ['sp', 'rj', 'mg', 'rs', 'pr', 'sc', 'ba', 'pe', 'ce', 'df', 'go', 'es', 'am', 'pa', 'ma', 'pb', 'rn', 'al', 'se', 'pi', 'mt', 'ms', 'to', 'ro', 'ac', 'ap', 'rr'];
  for (const st of brStates) {
    if (clean.includes(`-${st}`) || clean.includes(`/${st}`) || clean.includes(` ${st}`)) {
      return 'Brasil';
    }
  }

  // Busca direta ou por inclusão no mapa de cidades
  for (const [key, country] of Object.entries(CITY_TO_COUNTRY)) {
    const keyNorm = normalizeText(key);
    if (clean === keyNorm || clean.includes(keyNorm) || keyNorm.includes(clean)) {
      return country;
    }
  }

  // Se não encontrou no mapa específico, assume Brasil como padrão caso não haja indicação em contrário
  return 'Brasil';
}
