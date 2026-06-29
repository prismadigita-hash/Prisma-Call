import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader, Card, CardBody, Avatar, StatusBadge, ButtonLink, EmptyState } from '@/components/ui'
import { SetupBanner } from '@/components/setup-banner'
import { AutoRefresh } from '@/components/auto-refresh'
import { listCalls, listClosers } from '@/lib/data/queries'
import { fmtScore, fmtDate, STATUS_LABELS } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const selectCls =
  'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ closer?: string; status?: string; from?: string; to?: string }>
}) {
  const sp = await searchParams
  try {
    const [closers, calls] = await Promise.all([
      listClosers(),
      listCalls({ closerId: sp.closer, status: sp.status, from: sp.from, to: sp.to }),
    ])

    return (
      <>
        <AutoRefresh seconds={15} />
        <PageHeader
          title="Calls"
          subtitle="Todas as calls cadastradas e seus status de análise"
          action={<ButtonLink href="/calls/new"><Plus size={16} /> Nova call</ButtonLink>}
        />

        {/* Filters */}
        <Card className="mb-5">
          <CardBody>
            <form className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Closer</label>
                <select name="closer" defaultValue={sp.closer ?? ''} className={selectCls}>
                  <option value="">Todos</option>
                  {closers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
                <select name="status" defaultValue={sp.status ?? ''} className={selectCls}>
                  <option value="">Todos</option>
                  {Object.entries(STATUS_LABELS).filter(([k]) => k !== 'falhou').map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">De</label>
                <input type="date" name="from" defaultValue={sp.from ?? ''} className={selectCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Até</label>
                <input type="date" name="to" defaultValue={sp.to ?? ''} className={selectCls} />
              </div>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Filtrar
              </button>
              <Link href="/calls" className="px-2 py-2 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white">Limpar</Link>
            </form>
          </CardBody>
        </Card>

        {calls.length === 0 ? (
          <EmptyState
            title="Nenhuma call encontrada"
            description="Ajuste os filtros ou cadastre uma nova call."
            action={<ButtonLink href="/calls/new"><Plus size={16} /> Nova call</ButtonLink>}
          />
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {calls.map((call) => (
                <Link key={call.id} href={`/calls/${call.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Avatar name={call.closer?.name ?? '?'} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{call.client_name}</p>
                    <p className="text-xs text-slate-400">{call.closer?.name ?? '—'} · {fmtDate(call.call_date)}</p>
                  </div>
                  <StatusBadge status={call.status} />
                  <span className="w-12 text-right text-base font-bold text-slate-700 dark:text-slate-300">{fmtScore(call.overall_score)}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </>
    )
  } catch (err) {
    return (
      <>
        <PageHeader title="Calls" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }
}
