import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn, fmtScore, scoreTone, initials, STATUS_LABELS, STATUS_TONE } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card shadow-sm', className)}>{children}</div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_TONE[status] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

export function ScoreBadge({ score, size = 'md' }: { score: number | null | undefined; size?: 'sm' | 'md' | 'lg' }) {
  const tone = scoreTone(score)
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-12 w-12 text-base',
    lg: 'h-20 w-20 text-2xl',
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl font-bold ring-1 ring-inset',
        tone.bg,
        tone.text,
        tone.ring,
        sizes[size],
      )}
    >
      {fmtScore(score)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress bar (0..10)
// ---------------------------------------------------------------------------
export function ScoreBar({ score }: { score: number | null }) {
  const tone = scoreTone(score)
  const pct = score == null ? 0 : Math.max(0, Math.min(100, (Number(score) / 10) * 100))
  const fill =
    score == null
      ? 'bg-slate-300'
      : score >= 8
        ? 'bg-emerald-500'
        : score >= 6.5
          ? 'bg-lime-500'
          : score >= 5
            ? 'bg-amber-500'
            : 'bg-rose-500'
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={cn('h-full rounded-full', fill)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('w-9 text-right text-sm font-semibold tabular-nums', tone.text)}>{fmtScore(score)}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat card (KPI)
// ---------------------------------------------------------------------------
export function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  trend?: number | null
  icon?: ReactNode
}) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          <div className="mt-1 flex items-center gap-2">
            {trend !== undefined && trend !== null && <TrendPill value={trend} />}
            {hint && <span className="text-xs text-slate-400">{hint}</span>}
          </div>
        </div>
        {icon && <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">{icon}</div>}
      </CardBody>
    </Card>
  )
}

export function TrendPill({ value }: { value: number }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
        {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </CardBody>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Buttons (styled link + submit)
// ---------------------------------------------------------------------------
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50'
const btnVariants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm dark:shadow-[0_0_22px_-6px_rgba(99,102,241,0.65)]',
  secondary: 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
}: {
  href: string
  variant?: keyof typeof btnVariants
  className?: string
  children: ReactNode
}) {
  return (
    <Link href={href} className={cn(btnBase, btnVariants[variant], className)}>
      {children}
    </Link>
  )
}

export function SubmitButton({
  variant = 'primary',
  className,
  children,
  formAction,
}: {
  variant?: keyof typeof btnVariants
  className?: string
  children: ReactNode
  formAction?: (formData: FormData) => void | Promise<void>
}) {
  return (
    <button type="submit" formAction={formAction} className={cn(btnBase, btnVariants[variant], className)}>
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Chips / list bullets
// ---------------------------------------------------------------------------
export function Pill({ tone = 'slate', children }: { tone?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate'; children: ReactNode }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>
      {children}
    </span>
  )
}
