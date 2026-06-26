import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Proxy (ex-middleware) — apenas REFRESCA a sessão do Supabase a cada request,
// mantendo o cookie de auth válido. NÃO faz enforcement (não redireciona, não
// bloqueia): o sistema segue acessível como antes. Fail-open: qualquer erro
// resulta em seguir a request normalmente.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return response

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
    // Apenas dispara o refresh da sessão (se houver). Não decide acesso.
    await supabase.auth.getUser()
  } catch {
    // fail-open — nunca quebrar a navegação por causa do refresh de sessão
  }

  return response
}

// Exclui assets estáticos para não interferir em CSS/JS/imagens.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
