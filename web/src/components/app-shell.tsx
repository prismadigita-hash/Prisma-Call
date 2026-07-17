'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { Sidebar, MobileNav } from '@/components/sidebar'

// Em telas "nuas" (ex.: /login) NÃO mostramos a sidebar/menu do sistema —
// só o conteúdo (formulário de login). Nas demais, renderiza o app completo.
const BARE_ROUTES = ['/login']

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const bare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  if (bare) {
    return <main className="flex min-h-screen items-center justify-center px-4 py-8">{children}</main>
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        {/* key={pathname}: reinicia o fade-up a cada troca de página (não no auto-refresh) */}
        <main key={pathname} className="fade-up mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
