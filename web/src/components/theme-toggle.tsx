'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

// Alterna entre claro/escuro adicionando/removendo a classe .dark no <html>.
// Persiste em localStorage('theme'). O script anti-flash no layout aplica o
// tema antes da primeira pintura.
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // ignore
    }
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-400" />}
      {dark ? 'Modo claro' : 'Modo escuro'}
    </button>
  )
}

// Script inline (string) para aplicar o tema antes da pintura (evita flash).
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark')}}catch(e){}})();`
