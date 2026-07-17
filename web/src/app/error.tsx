'use client'

import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

// Boundary global de erro. Caso clássico: depois de um deploy, abas abertas
// antigas ficam com IDs de Server Action da versão anterior — todo botão de
// salvar falha em silêncio. Aqui detectamos esse cenário e recarregamos a
// página UMA vez automaticamente (guard em sessionStorage evita loop), o que
// traz a versão nova e os botões voltam a funcionar.
const STALE_PATTERNS = [/server action/i, /deployment/i, /failed to find/i, /fetch failed/i]

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const looksStale = STALE_PATTERNS.some((p) => p.test(error.message ?? ''))

  useEffect(() => {
    if (!looksStale) return
    const key = 'auto-reload-stale-action'
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    // limpa o guard depois de 30s para permitir nova auto-cura num próximo deploy
    setTimeout(() => sessionStorage.removeItem(key), 30_000)
    window.location.reload()
  }, [looksStale])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 p-3 text-indigo-500 ring-1 ring-inset ring-indigo-100 dark:from-indigo-500/15 dark:to-sky-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
        <RefreshCw size={24} />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
          {looksStale ? 'Nova versão do sistema disponível' : 'Algo deu errado'}
        </p>
        <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {looksStale
            ? 'A página está desatualizada em relação ao servidor. Recarregando automaticamente…'
            : 'Tente novamente. Se o problema persistir, recarregue a página.'}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-violet-500"
        >
          <RefreshCw size={15} /> Recarregar página
        </button>
        <button
          onClick={reset}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          Tentar de novo
        </button>
      </div>
    </div>
  )
}
