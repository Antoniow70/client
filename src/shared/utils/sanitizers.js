/**
 * Funções de sanitização e normalização de dados para o Frontend da plataforma ALEM.
 */

/**
 * Remove espaços em branco nas pontas e comprime múltiplos espaços internos num único.
 * @param {string} str
 * @returns {string}
 */
export function cleanString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Normaliza endereço de e-mail (remove espaços e converte para minúsculas).
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Mantém apenas dígitos numéricos (0-9).
 * @param {string|number} value
 * @returns {string}
 */
export function cleanDigits(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\D/g, '');
}

/**
 * Limpa número de telefone mantendo dígitos e o sinal de '+' inicial se existir.
 * @param {string} phone
 * @returns {string}
 */
export function cleanPhone(phone) {
  if (!phone) return '';
  const trimmed = String(phone).trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Converte nomes para Title Case (primeira letra de cada palavra maiúscula),
 * preservando conectivos comuns em português em minúsculas (de, da, do, das, dos, e).
 * @param {string} str
 * @returns {string}
 */
export function formatTitleCase(str) {
  if (!str) return '';
  const lowerWords = ['de', 'da', 'do', 'das', 'dos', 'e'];
  return cleanString(str)
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowerWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Converte string formatada monetária (ex: "1.500 MT" ou "250,50") para número float puro.
 * @param {string|number} value
 * @returns {number}
 */
export function parseCurrency(value) {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  // Remove MT, espaços, etc.
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '') // remove separador de milhar
    .replace(',', '.'); // ajusta vírgula decimal
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Sanitiza texto simples contra injeção de HTML/scripts.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (s) => entityMap[s]);
}
