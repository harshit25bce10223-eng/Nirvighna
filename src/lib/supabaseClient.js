import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://rojohpmvuoetsdiwmlya.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvam9ocG12dW9ldHNkaXdtbHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjkyNjIsImV4cCI6MjEwMDgwNTI2Mn0.pr5mUe6ndvIE_B-qxUjdKr-lgtMdMEk4dqkUBlTKmEg';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
