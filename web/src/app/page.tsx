import Link from 'next/link'
import { Plus, Users, PhoneCall, Gauge, TrendingDown } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  Card,
  CardBody,
  SectionTitle,
  ScoreBar,
  TrendPill,
  Avatar,
  StatusBadge,
  ButtonLink,
  EmptyState,
} from '@/components/ui'
import { BarList } from '@/components/charts'
import { SetupBanner } from '@/components/setup-banner'
import { listClosers, listCalls } from '@/lib/data/queries'
import { getDashboardMetrics } from '@/lib/data/metrics'
import { fmtScore, fmtDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const [closers, metrics, calls] = await Promise.all([
      listClosers(),
      getDashboardMetrics(),
      listCalls(),
    ])

    const ranking = closers
      .map((c) => ({ closer: c, m: metrics.byCloser[c.id] }))
      .filter((r) => r.m)
      .sort((a, b) => (b.m!.avgOverall ?? 0) - (a.m!.avgOverall ?? 0))

    const weakest = [...metrics.criteriaAverages]
      .filter((c) => c.avg != null)
      .sort((a, b) => (a.avg as number) - (b.avg as number))[0]

    const recentCalls = calls.slice(0, 6)

    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Visão geral da performance e evolução do time comercial"
          action={
            <ButtonLink href="/calls/new">
              <Plus size={16} /> Nova call
            </ButtonLink>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Closers ativos" value={closers.filter((c) => c.active).length} icon={<Users size={20} />} />
          <StatCard label="Calls analisadas" value={metrics.totalCallsAnalyzed} icon={<PhoneCall size={20} />} />
          <StatCard
            label="Nota média do time"
            value={fmtScore(metrics.teamAvg)}
            trend={metrics.teamEvolutionPct}
            hint="vs. período anterior"
            icon={<Gauge size={20} />}
          />
          <StatCard
            label="Critério a melhorar"
            value={weakest ? fmtScore(weakest.avg) : '—'}
            hint={weakest?.label ?? 'sem dados'}
            icon={<TrendingDown size={20} />}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Ranking */}
          <Card className="lg:col-span-2">
            <CardBody>
              <SectionTitle
                title="Ranking de Closers"
                subtitle="Média geral e evolução por vendedor"
                action={<ButtonLink href="/closers" variant="ghost">Ver todos</ButtonLink>}
              />
              {ranking.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Nenhuma call analisada ainda. Cadastre um Closer e analise a primeira call.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {ranking.map(({ closer, m }, idx) => (
                    <Link
                      key={closer.id}
                      href={`/closers/${closer.id}`}
                      className="flex items-center gap-4 py-3 transition hover:bg-slate-50 dark:bg-slate-800/60"
                    >
                      <span className="w-5 text-sm font-bold text-slate-400">{idx + 1}</span>
                      <Avatar name={closer.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{closer.name}</p>
                        <p className="text-xs text-slate-400">{m!.callsAnalyzed} calls analisadas</p>
                      </div>
                      <div className="w-40">
                        <ScoreBar score={m!.avgOverall} />
                      </div>
                      {m!.evolutionPct != null && <TrendPill value={m!.evolutionPct} />}
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Criteria team averages */}
          <Card>
            <CardBody>
              <SectionTitle title="Notas por critério" subtitle="Média do time" />
              <BarList items={metrics.criteriaAverages.map((c) => ({ label: c.label, value: c.avg }))} />
            </CardBody>
          </Card>
        </div>

        {/* Recent calls */}
        <div className="mt-6">
          <SectionTitle title="Calls recentes" action={<ButtonLink href="/calls" variant="ghost">Ver todas</ButtonLink>} />
          {recentCalls.length === 0 ? (
            <EmptyState
              title="Nenhuma call cadastrada"
              description="Importe a transcrição de uma call para gerar a primeira análise."
              action={<ButtonLink href="/calls/new"><Plus size={16} /> Nova call</ButtonLink>}
            />
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {recentCalls.map((call) => (
                  <Link key={call.id} href={`/calls/${call.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:bg-slate-800/60">
                    <Avatar name={call.closer?.name ?? '?'} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{call.client_name}</p>
                      <p className="text-xs text-slate-400">{call.closer?.name} · {fmtDate(call.call_date)}</p>
                    </div>
                    <StatusBadge status={call.status} />
                    <span className="w-10 text-right text-sm font-bold text-slate-700 dark:text-slate-300">{fmtScore(call.overall_score)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </>
    )
  } catch (err) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Visão geral da performance do time" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }
}
