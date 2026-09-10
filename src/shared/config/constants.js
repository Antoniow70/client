const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    envUrl = envUrl.trim().replace(/\/+$/, '');
    // Se for rota relativa como '/api' ou 'api'
    if (envUrl === '/api' || envUrl === 'api') {
      return '/api';
    }
    // Se for URL externa configurada (ex: backend customizado)
    if (!envUrl.endsWith('/api')) {
      envUrl = `${envUrl}/api`;
    }
    return envUrl;
  }

  // Em produção (Vercel ou qualquer domínio web que não seja localhost)
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Na Vercel, as Serverless Functions rodam na rota relativa /api da mesma origem
    return '/api';
  }

  // Em desenvolvimento local padrão
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
