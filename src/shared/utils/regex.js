/**
 * Catalogo central de expressoes regulares (RegEx) para validacao de dados
 * na plataforma ALEM (Mocambique e Internacional).
 */

// E-mail padrao RFC 5322 simplificado
export const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Telefones Mocambique (Vodacom 84/85, Movitel 86/87, Tmcel 82/83)
// Aceita formatos com ou sem prefixo +258 / 258
export const REGEX_PHONE_MZ = /^(?:\+258\s?|258\s?)?8[2-7]\d{7}$/;

// Especifico Vodacom M-Pesa (84, 85)
export const REGEX_PHONE_MPESA = /^(?:\+258\s?|258\s?)?8[45]\d{7}$/;

// Especifico Movitel e-Mola (86, 87)
export const REGEX_PHONE_EMOLA = /^(?:\+258\s?|258\s?)?8[67]\d{7}$/;

// Especifico Tmcel (82, 83)
export const REGEX_PHONE_TMCEL = /^(?:\+258\s?|258\s?)?8[23]\d{7}$/;

// Telefone Internacional E.164 flexivel (7 a 15 digitos com codigo de pais)
export const REGEX_PHONE_INTL = /^\+?[1-9]\d{7,14}$/;

// Codigo de recuperacao / OTP (6 a 8 digitos numericos)
export const REGEX_OTP = /^\d{6,8}$/;
export const REGEX_OTP_8 = /^\d{8}$/;

// Nomes pessoais com suporte total a acentos da lingua portuguesa
export const REGEX_NAME = /^[A-Za-zA-y\s'-]{2,100}$/;

// Nome completo (exige pelo menos primeiro e ultimo nome)
export const REGEX_FULL_NAME = /^[A-Za-zA-y'-]{2,}\s+[A-Za-zA-y'-]{2,}.*$/;

// NIB Mocambique (21 digitos numericos)
export const REGEX_NIB_MZ = /^\d{21}$/;

// IBAN Mocambique (MZ59 seguido de 21 digitos)
export const REGEX_IBAN_MZ = /^MZ59\d{21}$/i;

// Identificadores UUID v4
export const REGEX_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// Valores numericos inteiros e decimais
export const REGEX_NUMERIC = /^\d+$/;
export const REGEX_CURRENCY = /^\d+(\.\d{1,2})?$/;
