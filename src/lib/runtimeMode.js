// Demo mode is intentionally opt-in. Keep it true only on a presentation
// device; deployed environments must authenticate against Supabase.
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
