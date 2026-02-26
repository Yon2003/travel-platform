import { createClient } from '@supabase/supabase-js';

// ВРЕМЕННО: Hardcoded за локално тестване
// ВАЖНО: Преди deployment ТРЯБВА да се върне на env variables!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dspnykzmircudrxrzear.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_7kpem7juuHv5BB9LEa2TEQ_oGGamRcZ';

export const supabase = createClient(supabaseUrl, supabaseKey);