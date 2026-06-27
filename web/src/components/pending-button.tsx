'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  secondary: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

export function PendingButton({
  children,
  pendingText,
  variant = 'primary',
  className,
}: {
  children: ReactNode
  pendingText?: string
  variant?: keyof typeof variants
  className?: string
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60',
        variants[variant],
        className,
      )}
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {pending ? pendingText ?? 'Processando…' : children}
    </button>
  )
}
