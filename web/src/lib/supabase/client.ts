import { createBrowserClient } from '@supabase/ssr'

// Cliente Supabase para o NAVEGADOR (Client Components), usando a chave pública
// (anon/publishable). Respeita RLS — diferente do admin (service_role).
// Fundação para a autenticação por usuário (ETAPA 4); ainda não substitui o
// data layer atual baseado em service_role.
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
