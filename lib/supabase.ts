import { createClient } from '@supabase/supabase-js';

// KITA PAKAI LOGIKA "ATAU" (||)
// Artinya: Kalau Env Variable tidak terbaca, pakai link palsu ini supaya tidak error.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);