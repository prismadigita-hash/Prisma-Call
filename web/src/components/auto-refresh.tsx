'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Atualiza os dados da página automaticamente (soft refresh do RSC, sem recarregar
// a página inteira). Só roda quando a aba está visível, para ser leve.
export function AutoRefresh({ seconds = 25 }: { seconds?: number }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        router.refresh()
      }
    }, Math.max(8, seconds) * 1000)
    return () => clearInterval(id)
  }, [router, seconds])

  return null
}
