/**
 * Validadores síncronos e utilitários de regras de negócio para o Frontend da plataforma ALEM.
 * Retornam objetos estruturados { isValid: boolean, error?: string }.
 */

import {
  REGEX_EMAIL,
  REGEX_PHONE_MZ,
  REGEX_PHONE_MPESA,
  REGEX_PHONE_EMOLA,
  REGEX_PHONE_INTL,
  REGEX_NAME,
  REGEX_FULL_NAME,
  REGEX_OTP,
  REGEX_OTP_8
} from './regex';
import { cleanString, cleanPhone, cleanDigits } from './sanitizers';

/**
 * Valida formato de endereço de e-mail.
 * @param {string} email
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateEmail(email) {
  if (!email || !cleanString(email)) {
    return { isValid: false, error: 'O endereço de e-mail é obrigatório.' };
  }
  const normalized = email.trim().toLowerCase();
  if (!REGEX_EMAIL.test(normalized)) {
    return { isValid: false, error: 'Introduza um endereço de e-mail válido (ex: exemplo@email.com).' };
  }
  return { isValid: true };
}

/**
 * Valida número de telefone moçambicano ou internacional com opção de checagem de operadora.
 * @param {string} phone
 * @param {object} [options]
 * @param {'mpesa'|'emola'|'geral'|null} [options.method=null]
 * @param {boolean} [options.allowInternational=true]
 * @returns {{ isValid: boolean, error?: string, carrier?: string }}
 */
export function validatePhone(phone, { method = null, allowInternational = true } = {}) {
  if (!phone || !cleanString(phone)) {
    return { isValid: false, error: 'O número de telefone é obrigatório.' };
  }

  const cleaned = cleanPhone(phone);
  const digits = cleanDigits(phone);

  // Deteta operadora em Moçambique
  let localDigits = digits;
  if (localDigits.startsWith('258')) {
    localDigits = localDigits.slice(3);
  }

  let carrier = null;
  if (localDigits.length === 9) {
    const prefix = localDigits.slice(0, 2);
    if (['84', '85'].includes(prefix)) carrier = 'Vodacom';
    else if (['86', '87'].includes(prefix)) carrier = 'Movitel';
    else if (['82', '83'].includes(prefix)) carrier = 'Tmcel';
  }

  // Validação específica para M-Pesa (exige rede Vodacom: 84 ou 85)
  if (method === 'mpesa') {
    if (!REGEX_PHONE_MPESA.test(cleaned)) {
      return {
        isValid: false,
        carrier,
        error: 'Para transferências via M-Pesa, o número deve ser Vodacom (iniciado por 84 ou 85).'
      };
    }
    return { isValid: true, carrier: 'Vodacom' };
  }

  // Validação específica para e-Mola (exige rede Movitel: 86 ou 87)
  if (method === 'emola') {
    if (!REGEX_PHONE_EMOLA.test(cleaned)) {
      return {
        isValid: false,
        carrier,
        error: 'Para transferências via E-Mola, o número deve ser Movitel (iniciado por 86 ou 87).'
      };
    }
    return { isValid: true, carrier: 'Movitel' };
  }

  // Validação geral de telefone moçambicano
  if (REGEX_PHONE_MZ.test(cleaned)) {
    return { isValid: true, carrier };
  }

  // Validação internacional (se permitida)
  if (allowInternational && (cleaned.startsWith('+') || digits.length > 9)) {
    if (REGEX_PHONE_INTL.test(cleaned)) {
      return { isValid: true, carrier: 'Internacional' };
    }
    return {
      isValid: false,
      error: 'Formato internacional inválido. Utilize o formato com indicativo (ex: +351 912 345 678).'
    };
  }

  return {
    isValid: false,
    error: 'Número de telefone inválido. Em Moçambique, deve ter 9 dígitos (ex: 84 123 4567).'
  };
}

/**
 * Valida nome completo ou nome de pessoa/organização.
 * @param {string} name
 * @param {object} [options]
 * @param {boolean} [options.requireFullName=false]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateName(name, { requireFullName = false } = {}) {
  const cleaned = cleanString(name);
  if (!cleaned) {
    return { isValid: false, error: 'O nome é obrigatório.' };
  }
  if (cleaned.length < 3) {
    return { isValid: false, error: 'O nome deve ter pelo menos 3 caracteres.' };
  }
  if (!REGEX_NAME.test(cleaned)) {
    return { isValid: false, error: 'O nome deve conter apenas letras e espaços.' };
  }
  if (requireFullName && !REGEX_FULL_NAME.test(cleaned)) {
    return { isValid: false, error: 'Por favor, introduza o nome completo (primeiro e último nome).' };
  }
  return { isValid: true };
}

/**
 * Valida código de verificação OTP.
 * @param {string} code
 * @param {number} [expectedLength=8]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateOtp(code, expectedLength = 8) {
  const digits = cleanDigits(code);
  if (!digits) {
    return { isValid: false, error: 'Introduza o código de recuperação.' };
  }
  if (expectedLength === 8) {
    if (!REGEX_OTP_8.test(digits)) {
      return { isValid: false, error: 'O código de verificação deve ter exatamente 8 dígitos.' };
    }
  } else {
    if (!REGEX_OTP.test(digits)) {
      return { isValid: false, error: `O código deve ter entre 6 e ${expectedLength} dígitos.` };
    }
  }
  return { isValid: true };
}

/**
 * Valida valor de doação monetária.
 * @param {number|string} amount
 * @param {number} [min=10]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateDonationAmount(amount, min = 10) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Por favor, introduza um valor válido para doação.' };
  }
  if (num < min) {
    return { isValid: false, error: `O valor mínimo para doação é de ${min} MT.` };
  }
  return { isValid: true };
}

/**
 * Valida data de nascimento (não permite datas futuras e valida idade realista).
 * @param {string} dateStr Formato AAAA-MM-DD ou DD/MM/AAAA
 * @param {number} [minAge=0]
 * @param {number} [maxAge=120]
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateBirthDate(dateStr, minAge = 0, maxAge = 120) {
  if (!dateStr) {
    return { isValid: false, error: 'Data de nascimento é obrigatória.' };
  }

  let parsedDate;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    parsedDate = new Date(`${y}-${m}-${d}`);
  } else {
    parsedDate = new Date(dateStr);
  }

  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Data de nascimento inválida.' };
  }

  const today = new Date();
  if (parsedDate > today) {
    return { isValid: false, error: 'A data de nascimento não pode ser no futuro.' };
  }

  const age = today.getFullYear() - parsedDate.getFullYear();
  if (age > maxAge) {
    return { isValid: false, error: 'Por favor, introduza um ano de nascimento válido.' };
  }
  if (minAge > 0 && age < minAge) {
    return { isValid: false, error: `A idade mínima exigida é de ${minAge} anos.` };
  }

  return { isValid: true };
}

/**
 * Avalia a força e segurança de uma palavra-passe.
 * Retorna score (0-4), rótulo, classes visuais e checklist individual de critérios.
 * @param {string} password
 * @returns {{
 *   score: number,
 *   label: string,
 *   colorBg: string,
 *   colorText: string,
 *   percent: number,
 *   checks: {
 *     hasMinLength: boolean,
 *     hasLower: boolean,
 *     hasUpper: boolean,
 *     hasNumber: boolean,
 *     hasSpecial: boolean
 *   },
 *   feedback: string[]
 * }}
 */
export function evaluatePasswordStrength(password) {
  const pwd = password || '';
  const checks = {
    hasMinLength: pwd.length >= 8,
    hasLower: /[a-z]/.test(pwd),
    hasUpper: /[A-Z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  };

  const feedback = [];
  if (!checks.hasMinLength) feedback.push('Pelo menos 8 caracteres');
  if (!checks.hasLower) feedback.push('Pelo menos 1 letra minúscula');
  if (!checks.hasUpper) feedback.push('Pelo menos 1 letra maiúscula');
  if (!checks.hasNumber) feedback.push('Pelo menos 1 número');
  if (!checks.hasSpecial) feedback.push('Pelo menos 1 caractere especial (!@#$...)');

  let passedCount = 0;
  if (checks.hasMinLength) passedCount++;
  if (checks.hasLower && checks.hasUpper) passedCount++;
  if (checks.hasNumber) passedCount++;
  if (checks.hasSpecial) passedCount++;

  let score = 0;
  let label = 'Muito fraca';
  let colorBg = 'bg-rose-500';
  let colorText = 'text-rose-600 dark:text-rose-400';
  let percent = 15;

  if (pwd.length === 0) {
    return {
      score: 0,
      label: 'Insira a palavra-passe',
      colorBg: 'bg-slate-300 dark:bg-dark-muted/40',
      colorText: 'text-slate-400',
      percent: 0,
      checks,
      feedback
    };
  }

  if (passedCount === 1 || pwd.length < 6) {
    score = 1;
    label = 'Fraca';
    colorBg = 'bg-rose-500';
    colorText = 'text-rose-600 dark:text-rose-400';
    percent = 25;
  } else if (passedCount === 2) {
    score = 2;
    label = 'Razoável';
    colorBg = 'bg-amber-500';
    colorText = 'text-amber-600 dark:text-amber-400';
    percent = 50;
  } else if (passedCount === 3) {
    score = 3;
    label = 'Boa';
    colorBg = 'bg-blue-500';
    colorText = 'text-blue-600 dark:text-blue-400';
    percent = 75;
  } else if (passedCount >= 4) {
    score = 4;
    label = 'Forte';
    colorBg = 'bg-emerald-500';
    colorText = 'text-emerald-600 dark:text-emerald-400';
    percent = 100;
  }

  return {
    score,
    label,
    colorBg,
    colorText,
    percent,
    checks,
    feedback
  };
}
