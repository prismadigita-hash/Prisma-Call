'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const variants = {
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  dangerGhost:
    'text-rose-600 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:ring-rose-500/30 dark:hover:bg-rose-500/10',
}

// Botão de submit com confirmação (window.confirm) + estado "pendente".
export function ConfirmButton({
  children,
  confirmMessage,
  variant = 'dangerGhost',
  className,
}: {
  children: ReactNode
  confirmMessage: string
  variant?: keyof typeof variants
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault()
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60',
        variants[variant],
        className,
      )}
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
