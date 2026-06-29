import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import {
  PageHeader,
  Card,
  CardBody,
  SectionTitle,
  StatCard,
  Avatar,
  ScoreBar,
  TrendPill,
  StatusBadge,
  Pill,
  ButtonLink,
} from '@/components/ui'
import { LineChart, RadarChart } from '@/components/charts'
import { ConfirmButton } from '@/components/confirm-button'
import { SetupBanner } from '@/components/setup-banner'
import { deleteCloser } from '@/lib/actions/closers'
import { Trash2 } from 'lucide-react'
import { shortLabelFor } from '@/lib/criteria'
import { getCloser, listCalls } from '@/lib/data/queries'
import { getCloserEvolution, countAppliedActions } from '@/lib/data/metrics'
import { fmtScore, fmtDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function CloserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const closer = await getCloser(id)
    if (!closer) notFound()

    const [evolution, applied, calls] = await Promise.all([
      getCloserEvolution(id),
      countAppliedActions(id),
      listCalls({ closerId: id }),
    ])

    const criterionAvg = (key: string) =>
      evolution.criteriaAverages.find((c) => c.key === key)?.avg ?? null

    return (
      <>
        <Link href="/closers" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white">
          <ArrowLeft size={15} /> Closers
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Avatar name={closer.name} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{closer.name}</h1>
            <p className="text-sm text-slate-500">{closer.role ?? 'Closer'}{closer.email ? ` · ${closer.email}` : ''}</p>
          </div>
          <form action={deleteCloser}>
            <input type="hidden" name="id" value={closer.id} />
            <ConfirmButton confirmMessage={`Excluir o Closer "${closer.name}"? Isso também apaga TODAS as calls e análises dele. Esta ação não pode ser desfeita.`}>
              <Trash2 size={16} /> Excluir Closer
            </ConfirmButton>
          </form>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Nota média geral" value={fmtScore(evolution.avgOverall)} trend={evolution.evolutionPct} />
          <StatCard label="Calls analisadas" value={evolution.callsAnalyzed} />
          <StatCard label="Diagnóstico" value={fmtScore(criterionAvg('diagnostico'))} hint="média" />
          <StatCard label="Feedbacks aplicados" value={applied} hint="ações concluídas" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Condução" value={fmtScore(criterionAvg('conducao'))} hint="média" />
          <StatCard label="Quebra de objeções" value={fmtScore(criterionAvg('quebra_objecoes'))} hint="média" />
          <StatCard label="Fechamento" value={fmtScore(criterionAvg('fechamento'))} hint="média" />
          <StatCard label="Criação de valor" value={fmtScore(criterionAvg('criacao_valor'))} hint="média" />
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardBody>
              <SectionTitle title="Evolução das notas" subtitle="Nota geral por call ao longo do tempo" />
              <LineChart
                points={evolution.timeline.map((t) => ({ label: fmtDate(t.date).slice(0, 5), value: t.score }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <SectionTitle title="Radar de critérios" subtitle="Média por competência" />
              <RadarChart data={evolution.criteriaAverages.map((c) => ({ label: shortLabelFor(c.key), value: c.avg }))} />
            </CardBody>
          </Card>
        </div>

        {/* Strengths / weaknesses + recent vs previous */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardBody>
              <SectionTitle title="Pontos fortes e de melhoria" subtitle="Recorrentes nas calls" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">Fortes</p>
                  <div className="space-y-1.5">
                    {evolution.strengths.length === 0 && <p className="text-xs text-slate-400">—</p>}
                    {evolution.strengths.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{s.label}</span>
                        <span className="text-xs font-semibold text-emerald-600">{fmtScore(s.avg)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">A melhorar</p>
                  <div className="space-y-1.5">
                    {evolution.weaknesses.length === 0 && <p className="text-xs text-slate-400">—</p>}
                    {evolution.weaknesses.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{s.label}</span>
                        <span className="text-xs font-semibold text-rose-600">{fmtScore(s.avg)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <SectionTitle title="Comparativo: recentes vs anteriores" subtitle="Metade mais recente das calls vs metade anterior" />
              <div className="space-y-2.5">
                {evolution.recentVsPrevious
                  .filter((r) => r.recent != null || r.previous != null)
                  .map((r) => {
                    const delta = r.recent != null && r.previous != null ? r.recent - r.previous : null
                    return (
                      <div key={r.criterion_key} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{r.label}</span>
                        <span className="w-10 text-right tabular-nums text-slate-400">{fmtScore(r.previous)}</span>
                        <span className="text-slate-300">→</span>
                        <span className="w-10 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300">{fmtScore(r.recent)}</span>
                        <span className="w-14 text-right">
                          {delta != null ? (
                            <Pill tone={delta >= 0 ? 'emerald' : 'rose'}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}</Pill>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                {evolution.callsAnalyzed < 2 && (
                  <p className="text-xs text-slate-400">Precisa de pelo menos 2 calls analisadas para comparar.</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Calls list */}
        <div className="mt-6">
          <SectionTitle title="Calls do Closer" action={<ButtonLink href="/calls/new" variant="ghost">Nova call</ButtonLink>} />
          {calls.length === 0 ? (
            <Card><CardBody><p className="py-6 text-center text-sm text-slate-400">Nenhuma call ainda.</p></CardBody></Card>
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {calls.map((call) => (
                  <Link key={call.id} href={`/calls/${call.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{call.client_name}</p>
                      <p className="text-xs text-slate-400">{fmtDate(call.call_date)}</p>
                    </div>
                    <StatusBadge status={call.status} />
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {call.status === 'concluida' || call.status === 'revisada' ? <CheckCircle2 size={14} className="text-emerald-500" /> : null}
                      {fmtScore(call.overall_score)}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </>
    )
  } catch (err) {
    unstable_rethrow(err)
    return (
      <>
        <PageHeader title="Closer" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }
}
