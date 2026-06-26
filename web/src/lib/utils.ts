import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with conditional logic. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a 0..10 score with one decimal, or "—" when null. */
export function fmtScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return '—'
  return Number(score).toFixed(1)
}

/** Tailwind text/bg color bucket for a 0..10 score. */
export function scoreTone(score: number | null | undefined): {
  text: string
  bg: string
  ring: string
  label: string
} {
  if (score === null || score === undefined) {
    return { text: 'text-slate-400', bg: 'bg-slate-100', ring: 'ring-slate-200', label: 'Sem nota' }
  }
  const s = Number(score)
  if (s >= 8) return { text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200', label: 'Excelente' }
  if (s >= 6.5) return { text: 'text-lime-700', bg: 'bg-lime-50', ring: 'ring-lime-200', label: 'Bom' }
  if (s >= 5) return { text: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-200', label: 'Regular' }
  return { text: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-200', label: 'Atenção' }
}

/** Format an ISO/date string to dd/mm/yyyy (pt-BR). */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Initials from a name, e.g. "João Silva" -> "JS". */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export const STATUS_LABELS: Record<string, string> = {
  recebida: 'Recebida',
  pendente: 'Pendente',
  em_analise: 'Em análise',
  concluida: 'Concluída',
  revisada: 'Revisada',
  erro_na_analise: 'Erro na análise',
  falhou: 'Falhou',
}

export const STATUS_TONE: Record<string, string> = {
  recebida: 'bg-sky-50 text-sky-700 ring-sky-200',
  pendente: 'bg-slate-100 text-slate-600 ring-slate-200',
  em_analise: 'bg-amber-50 text-amber-700 ring-amber-200',
  concluida: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  revisada: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  erro_na_analise: 'bg-rose-50 text-rose-700 ring-rose-200',
  falhou: 'bg-rose-50 text-rose-700 ring-rose-200',
}
