import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase credentials missing! Copy .env.example to .env and fill in your project details.'
    )
}

// Use relative proxy URL in production to bypass adblockers
// IMPORTANT: Supabase createClient requires a fully-formed URL, not a relative path.
const isDev = import.meta.env.DEV;
const origin = typeof window !== 'undefined' ? window.location.origin : '';
const finalSupabaseUrl = isDev
    ? (supabaseUrl || 'https://placeholder.supabase.co')
    : `${origin}/api/supabase`;

// Detect recovery token BEFORE Supabase processes it
const isRecoveryFlow = window.location.hash.includes('type=recovery') &&
    window.location.hash.includes('access_token')
if (isRecoveryFlow) {
    sessionStorage.setItem('sidekick_password_recovery', '1')
}

export const supabase = createClient(
    finalSupabaseUrl,
    supabaseAnonKey || 'placeholder-key'
)