import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente Supabase para o SERVIDOR (Server Components / Server Actions / Route
// Handlers) ligado à sessão do usuário via cookies. Respeita RLS (chave anon).
// É a base para migrar o acesso a dados para o usuário autenticado (ETAPA 4),
// sem remover o admin (service_role) atual — adoção gradual e sem quebra.
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // chamado de um Server Component (sem permissão de escrita de cookie).
            // A renovação de sessão deve ocorrer no proxy/middleware — ignorar aqui.
          }
        },
      },
    },
  )
}
