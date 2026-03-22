import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijnajdpcplapwiyvzsdh.supabase.co';
const supabaseKey = 'sb_secret_npPQJSJtOVSfpAhN-MjjZg_6d5YbZkC';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
