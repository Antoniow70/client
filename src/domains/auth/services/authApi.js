import axiosClient from '../../../shared/lib/axiosClient';
import { supabase } from '../../../shared/lib/supabaseClient';

/**
 * Logs in the admin user using the Node.js REST API
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} Session data
 */
export async function loginAdmin(email, password) {
  const response = await axiosClient.post('/auth/login', { email, password });
  const data = response.data.data;
  if (data?.session) {
    localStorage.setItem('sb-session', JSON.stringify(data.session));
  }
  return data;
}

/**
 * Logs out the admin user using the Node.js REST API
 */
export async function logoutAdmin() {
  try {
    await axiosClient.post('/auth/logout');
  } catch (e) {
    console.error('Sign out error in backend:', e);
  } finally {
    localStorage.removeItem('sb-session');
  }
}

/**
 * Validates the current session token with the Node.js REST API
 * @returns {Promise<object|null>} The active session or null
 */
export async function getCurrentSession() {
  const sessionStr = localStorage.getItem('sb-session');
  if (!sessionStr) return null;
  
  try {
    const session = JSON.parse(sessionStr);
    if (!session?.access_token) return null;
    
    const response = await axiosClient.get('/auth/me');
    if (response.data.success) {
      return session;
    }
  } catch (e) {
    console.error('Error verifying session:', e);
    localStorage.removeItem('sb-session');
  }
  return null;
}

/**
 * Solicita recuperacao de palavra-passe pelo backend (Supabase Admin + E-mail Institucional com OTP)
 * @param {string} email
 * @returns {Promise<object>}
 */
export async function requestPasswordRecovery(email) {
  try {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (backendErr) {
    console.warn('⚠️ Falha ao solicitar recuperacao via backend, tentando direto pelo Supabase Auth:', backendErr);
    const redirectTo = `${window.location.origin}/admin/recuperar-senha`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    if (error) throw error;
    return {
      success: true,
      message: 'Link de recuperacao enviado pelo Supabase! Verifique a sua caixa de entrada.'
    };
  }
}

/**
 * Valida o token_hash ou o codigo OTP para recuperacao de palavra-passe
 * @param {object} params
 * @param {string} [params.token_hash] - Hash do token direto
 * @param {string} [params.email] - E-mail do utilizador
 * @param {string} [params.token] - Codigo OTP numerico (ex: 8 digitos)
 * @returns {Promise<object>}
 */
export async function verifyRecoveryOtp({ token_hash, email, token }) {
  let result;
  if (token_hash) {
    result = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery'
    });
  } else if (email && token) {
    result = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'recovery'
    });
  } else {
    throw new Error('Parametros de verificacao invalidos. Forneca o token ou o codigo.');
  }

  if (result.error) throw result.error;

  if (result.data?.session) {
    localStorage.setItem('sb-session', JSON.stringify(result.data.session));
  }

  return result.data;
}

/**
 * Atualiza a palavra-passe do utilizador usando o token de recuperacao ou sessao ativa
 * @param {string} newPassword
 * @returns {Promise<object>}
 */
export async function updateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    // Fallback defensivo via backend caso tenhamos sessao ativa no interceptor
    try {
      const response = await axiosClient.post('/auth/reset-password', { password: newPassword });
      return response.data;
    } catch (fallbackErr) {
      throw error;
    }
  }

  if (data?.session) {
    localStorage.setItem('sb-session', JSON.stringify(data.session));
  }

  return { success: true, data };
}


