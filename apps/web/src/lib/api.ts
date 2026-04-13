import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const providedKey = process.env.SUPABASE_SERVICE_KEY;
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNiz43_04Dq4bL3C_ngUshOkvKQo';
const supabaseKey = providedKey && providedKey.startsWith('eyJ') ? providedKey : fallbackKey;

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
