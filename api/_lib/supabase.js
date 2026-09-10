import { createClient } from '@supabase/supabase-js';

let supabase = null;
let supabaseAdmin = null;

export function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ewnhvxkffxhgncwlnhsh.supabase.co';
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3IpEzNq1N6yayrwyk7ocqA_1ebreaec';

  if (!url || !key) {
    return null;
  }

  supabase = createClient(url, key);
  return supabase;
}

export function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ewnhvxkffxhgncwlnhsh.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  supabaseAdmin = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  return supabaseAdmin;
}
