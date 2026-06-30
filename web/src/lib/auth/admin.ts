import 'server-only'
import { createServerSupabase } from '@/lib/supabase/server'

// Controle de ADMIN do sistema. O admin é definido pelo(s) e-mail(s) em
// ADMIN_EMAILS (separados por vírgula). Se a env não estiver setada, cai no
// padrão abaixo. Comparação sempre em minúsculas.
//
// Hoje só serve para restringir ações de gestão de Closers (criar / excluir):
// apenas o admin pode; os demais logins continuam usando o sistema normalmente.
const DEFAULT_ADMINS = ['prismadigita@gmail.com']

function adminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return fromEnv.length ? fromEnv : DEFAULT_ADMINS
}

/** E-mail do usuário logado (em minúsculas) ou null se não houver sessão. */
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.auth.getUser()
    return data?.user?.email?.toLowerCase() ?? null
  } catch {
    return null
  }
}

/** true se o usuário logado é admin (e-mail está na lista de ADMIN_EMAILS). */
export async function isAdmin(): Promise<boolean> {
  const email = await getCurrentUserEmail()
  if (!email) return false
  return adminEmails().includes(email)
}

/** Garante que a ação só rode para o admin — lança erro caso contrário. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Ação restrita: apenas o administrador pode criar ou excluir Closers.')
  }
}
