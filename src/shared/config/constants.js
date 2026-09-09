const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    envUrl = envUrl.trim().replace(/\/+$/, '');
    // Se o usuário configurar o domínio base sem /api (ex: https://meu-app.onrender.com)
    if (!envUrl.endsWith('/api')) {
      envUrl = `${envUrl}/api`;
    }
    return envUrl;
  }

  // Em ambiente de rede local de desenvolvimento
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.hostname.endsWith('.vercel.app')) {
      console.warn('⚠️ [ALEM] VITE_API_URL não foi definida nas variáveis de ambiente da Vercel. Por favor, adicione VITE_API_URL no painel da Vercel.');
    } else {
      return `http://${window.location.hostname}:3001/api`;
    }
  }

  return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
