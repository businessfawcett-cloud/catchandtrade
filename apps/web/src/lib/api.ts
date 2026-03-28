import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

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
  return process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://catchandtrade.com';
}

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'https://catchandtrade.com/api';
}
