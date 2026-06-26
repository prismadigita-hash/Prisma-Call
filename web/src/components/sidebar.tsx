'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  ListChecks,
  Settings,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/closers', label: 'Closers', icon: Users },
  { href: '/calls', label: 'Calls', icon: PhoneCall },
  { href: '/criteria', label: 'Critérios', icon: ListChecks },
  { href: '/settings/slack', label: 'Slack', icon: MessageSquare },
  { href: '/settings', label: 'Configurações', icon: Settings, exact: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-white px-3 py-5 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Sparkles size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">Call Intelligence</p>
          <p className="text-[11px] text-slate-400">Sales Coaching IA</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-400'} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">MVP</p>
        <p className="mt-0.5">Transcrição → IA → Slack → Evolução</p>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-white px-2 py-2 md:hidden">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium',
              active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500',
            )}
          >
            <Icon size={15} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
