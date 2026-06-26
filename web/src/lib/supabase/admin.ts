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

  // Prefere variáveis de RUNTIME (não-públicas), que não dependem de build args
  // do Docker. Cai para as NEXT_PUBLIC_* (úteis em dev) quando as de runtime não
  // existem. Isso evita o erro "Supabase não configurado" em deploy (EasyPanel),
  // onde as NEXT_PUBLIC_* são embutidas no build e podem vir vazias no servidor.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = serviceKey || anonKey

  if (!url || !key) {
    throw new Error(
      'Supabase não configurado. Defina SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no ambiente.',
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
