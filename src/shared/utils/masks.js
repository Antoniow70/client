/**
 * Mascaras interativas de formatacao de inputs para o Frontend da plataforma ALEM.
 * Permitem formatacao visual em tempo real no evento onChange.
 */

import { cleanDigits } from './sanitizers';

/**
 * Aplica mascara de telefone (Mocambique ou Internacional).
 * Formatos resultantes:
 * - Local MZ (9 digitos): "84 123 4567"
 * - Prefixo MZ (+258): "+258 84 123 4567"
 * - Internacional geral: "+XXX XXX XXX..."
 * @param {string} value
 * @returns {string}
 */
export function maskPhone(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  const isPlus = trimmed.startsWith('+');
  const digits = cleanDigits(value);

  // Se comecou com 258 (com ou sem +)
  if (digits.startsWith('258')) {
    const local = digits.slice(3, 12); // ate 9 digitos locais
    let result = '+258';
    if (local.length > 0) result += ' ' + local.slice(0, 2);
    if (local.length > 2) result += ' ' + local.slice(2, 5);
    if (local.length > 5) result += ' ' + local.slice(5, 9);
    return result;
  }

  // Se comecou com sinal de '+' mas nao e 258 (Internacional)
  if (isPlus) {
    const limited = digits.slice(0, 15);
    let result = '+';
    for (let i = 0; i < limited.length; i++) {
      if (i > 0 && i % 3 === 0) result += ' ';
      result += limited[i];
    }
    return result;
  }

  // Padrao nacional de Mocambique: 9 digitos ("84 123 4567")
  const limited = digits.slice(0, 9);
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5, 9)}`;
}

/**
 * Aplica mascara em codigo OTP / recuperacao (agrupamento ergonomico de digitos).
 * Ex: "12345678" -> "1234 5678"
 * @param {string} value
 * @param {number} [maxLength=8]
 * @returns {string}
 */
export function maskOtp(value, maxLength = 8) {
  if (!value) return '';
  const digits = cleanDigits(value).slice(0, maxLength);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/**
 * Formata valores numericos para moeda em Meticais (MT).
 * Ex: 1000 -> "1 000 MT" ou "1 500,00 MT"
 * @param {number|string} value
 * @param {object} [options]
 * @param {boolean} [options.withDecimals=false]
 * @param {boolean} [options.withSuffix=true]
 * @returns {string}
 */
export function maskCurrencyMZN(value, { withDecimals = false, withSuffix = true } = {}) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return '';

  const formatted = new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 2
  }).format(num);

  // Substitui separador de milhar por espaco limpo
  const cleanFormatted = formatted.replace(/\u00A0/g, ' ');
  return withSuffix ? `${cleanFormatted} MT` : cleanFormatted;
}

/**
 * Aplica mascara em NIB mocambicano (21 digitos agrupados em blocos de 4).
 * Ex: "0001 0002 0003 0004 0005 1"
 * @param {string} value
 * @returns {string}
 */
export function maskNIB(value) {
  if (!value) return '';
  const digits = cleanDigits(value).slice(0, 21);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Aplica mascara em data DD/MM/AAAA enquanto o utilizador digita.
 * @param {string} value
 * @returns {string}
 */
export function maskDate(value) {
  if (!value) return '';
  const digits = cleanDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Remove formatacao visual de uma string preservando apenas o valor canonico.
 * @param {string} value
 * @returns {string}
 */
export function stripMask(value) {
  if (!value) return '';
  return cleanDigits(value);
}
