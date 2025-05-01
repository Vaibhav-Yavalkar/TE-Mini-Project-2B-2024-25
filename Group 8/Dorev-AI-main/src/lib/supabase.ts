import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Business = Database['public']['Tables']['businesses']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewCollectionSettings = Database['public']['Tables']['review_collection_settings']['Row'];