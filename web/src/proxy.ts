import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Proxy (ex-middleware): refresca a sessão do Supabase E aplica o LOGIN
// OBRIGATÓRIO — usuário sem sessão é redirecionado para /login.
//
// Rotas públicas (sem login): /login, o webhook do Tactiq (/api/webhooks/*),
// callbacks de auth e as rotas de diagnóstico.
//
// Segurança contra lockout: se o Supabase NÃO estiver configurado (sem URL/anon),
// o enforcement é desligado (não trava ninguém num /login que não funciona).
// Lê env de RUNTIME (SUPABASE_URL/SUPABASE_ANON_KEY) — não depende de build args.

const PUBLIC_PREFIXES = ['/login', '/api/webhooks', '/auth', '/api/diag']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path.startsWith(p))

  // Sem Supabase configurado -> não dá pra autenticar -> não trava o acesso.
  if (!url || !anon) return response

  let user: unknown = null
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    // Falha ao verificar sessão -> fail-open (não trava navegação)
    return response
  }

  // Não logado e tentando acessar área protegida -> manda pro login
  if (!user && !isPublic) {
    const to = request.nextUrl.clone()
    to.pathname = '/login'
    to.search = ''
    return NextResponse.redirect(to)
  }

  // Já logado e indo pro /login -> manda pro dashboard
  if (user && path === '/login') {
    const to = request.nextUrl.clone()
    to.pathname = '/'
    to.search = ''
    return NextResponse.redirect(to)
  }

  return response
}

// Exclui assets estáticos para não interferir em CSS/JS/imagens.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
