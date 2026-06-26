import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-only Supabase client.
//
// Prefers the service_role key (bypasses RLS) for full backend access. Falls
// back to the publishable/anon key so the app can still boot and run reads
// before the service_role key is configured — writes will be blocked by RLS
// in that case, which is the safe default.
//
// NEVER import this module from a Client Component.

let cached: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = serviceKey || anonKey

  if (!url || !key) {
    throw new Error(
      'Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY) em .env.local',
    )
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

/** True when the secret service_role key is configured (full backend access). */
export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}
