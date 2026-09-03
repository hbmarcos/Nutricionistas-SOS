/**
 * Mapeamento curado de imagens em alta resolução (Unsplash) para cidades.
 */
const CITY_IMAGE_MAP = {
  // Brasil - Principais cidades e capitais
  'salvador': 'https://images.unsplash.com/photo-1548625361-18a7a8d58c8b?auto=format&fit=crop&w=1920&q=80',
  'são paulo': 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1920&q=80',
  'sao paulo': 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1920&q=80',
  'rio de janeiro': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1920&q=80',
  'belo horizonte': 'https://images.unsplash.com/photo-1599385640237-775677093259?auto=format&fit=crop&w=1920&q=80',
  'brasília': 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=1920&q=80',
  'brasilia': 'https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=1920&q=80',
  'fortaleza': 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1920&q=80',
  'curitiba': 'https://images.unsplash.com/photo-1620882173169-b57022081d6f?auto=format&fit=crop&w=1920&q=80',
  'florianópolis': 'https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?auto=format&fit=crop&w=1920&q=80',
  'florianopolis': 'https://images.unsplash.com/photo-1598301257982-0cf014dabbcd?auto=format&fit=crop&w=1920&q=80',
  'manaus': 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=1920&q=80',
  'recife': 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&w=1920&q=80',
  'porto alegre': 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1920&q=80',
  'belém': 'https://images.unsplash.com/photo-1590680149021-f8e17b88ec7b?auto=format&fit=crop&w=1920&q=80',
  'belem': 'https://images.unsplash.com/photo-1590680149021-f8e17b88ec7b?auto=format&fit=crop&w=1920&q=80',
  'goiânia': 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1920&q=80',
  'goiania': 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1920&q=80',
  'campinas': 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1920&q=80',
  'vitória': 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1920&q=80',

  // Portugal & Europa
  'lisboa': 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=1920&q=80',
  'porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1920&q=80',
  'londres': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80',
  'madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1920&q=80',
  'roma': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1920&q=80',

  // América do Norte e Latina
  'buenos aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=1920&q=80',
  'santiago': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1920&q=80',
  'nova york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1920&q=80',
  'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1920&q=80',
  'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?auto=format&fit=crop&w=1920&q=80',
  'luanda': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1920&q=80',
  'maputo': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1920&q=80'
};

/**
 * Fallback genérico de paisagem urbana de cidade
 */
const DEFAULT_CITY_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?auto=format&fit=crop&w=1920&q=80';

/**
 * Normaliza o texto removendo acentos e deixando em minúsculas
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
 * Retorna a URL da imagem de fundo correspondente à cidade informada.
 * Retorna `null` caso a cidade esteja em branco ou não tenha sido informada.
 */
export function getCityImageUrl(cityInput) {
  if (!cityInput || !cityInput.trim()) {
    return null;
  }

  const clean = normalizeText(cityInput);

  // Busca exata ou por palavra no mapa curado
  for (const [key, url] of Object.entries(CITY_IMAGE_MAP)) {
    const keyNorm = normalizeText(key);
    if (clean.includes(keyNorm) || keyNorm.includes(clean)) {
      return url;
    }
  }

  // Se uma cidade foi informada mas não está no mapa curado, usa a paisagem de cidade padrão
  return DEFAULT_CITY_IMAGE;
}
