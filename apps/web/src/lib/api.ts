import { createClient } from '@supabase/supabase-js';

function getEnvOrWarn(varName: string, fallback: string | undefined): string {
  const value = process.env[varName] || fallback;
  if (!value || value.includes('REPLACE_WITH') || value.includes('fallback')) {
    console.warn(`Warning: ${varName} not set, using fallback. Set in Vercel for production.`);
  }
  return value || fallback || '';
}

const supabaseUrl = getEnvOrWarn('NEXT_PUBLIC_SUPABASE_URL', 'https://ijnajdpcplapwiyvzsdh.supabase.co');
const supabaseKey = getEnvOrWarn('SUPABASE_SERVICE_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

export function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

export function getSupabaseUrl() {
  return supabaseUrl;
}

export function getSupabaseKey() {
  return supabaseKey;
}

export function getWebUrl() {
  return getEnvOrWarn('NEXT_PUBLIC_WEB_URL', process.env.NEXT_PUBLIC_APP_URL) || 'https://catchandtrade.com';
}

export function getApiUrl() {
  return getEnvOrWarn('NEXT_PUBLIC_API_URL', undefined) || 'https://catchandtrade.com/api';
}
