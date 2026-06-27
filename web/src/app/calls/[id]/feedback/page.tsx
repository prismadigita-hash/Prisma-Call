import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { ArrowLeft, ThumbsUp, ThumbsDown, Check, RotateCcw, Lightbulb, Quote } from 'lucide-react'
import { PageHeader, Card, CardBody, SectionTitle, ScoreBadge, Avatar, ScoreBar, EmptyState, ButtonLink } from '@/components/ui'
import { PendingButton } from '@/components/pending-button'
import { SetupBanner } from '@/components/setup-banner'
import { RootCausePanel } from '@/components/root-cause'
import { getFullAnalysis } from '@/lib/data/queries'
import { labelFor } from '@/lib/criteria'
import { setActionStatus } from '@/lib/actions/analysis'
import { fmtDate } from '@/lib/utils'
import type { RootCause } from '@/lib/types'

export const dynamic = 'force-dynamic'

const PRIORITY = { 1: { label: 'Alta', tone: 'text-rose-600 bg-rose-50' }, 2: { label: 'Média', tone: 'text-amber-600 bg-amber-50' }, 3: { label: 'Baixa', tone: 'text-slate-500 bg-slate-100 dark:bg-slate-800' } } as const

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const data = await getFullAnalysis(id)
    if (!data) notFound()

    const { call, closer, analysis, scores, feedback, actions } = data
    // Diagnóstico de causa raiz (skill Prisma) vem guardado em analysis.raw.
    const rootCause = (analysis?.raw as { root_cause?: RootCause } | null)?.root_cause ?? null

    if (!analysis || analysis.status !== 'concluida' || !feedback) {
      return (
        <>
          <Backlink id={id} />
          <PageHeader title="Feedback" />
          <EmptyState
            title="Feedback ainda não disponível"
            description="Analise a call com IA para gerar o feedback final."
            action={<ButtonLink href={`/calls/${id}`}>Ir para a call</ButtonLink>}
          />
        </>
      )
    }

    return (
      <>
        <Backlink id={id} />

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <ScoreBadge score={analysis.overall_score} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Feedback final</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {closer && (
                <span className="flex items-center gap-1.5"><Avatar name={closer.name} size={20} /> {closer.name}</span>
              )}
              <span>· {call.client_name}</span>
              <span>· {fmtDate(call.call_date)}</span>
            </div>
          </div>
        </div>

        {/* Final comment — the human, direct message */}
        <Card className="mb-6 border-indigo-100 bg-indigo-50/40">
          <CardBody>
            <div className="flex items-start gap-3">
              <Quote size={22} className="shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Comentário final</p>
                <p className="mt-1 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">{feedback.final_comment}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Diagnóstico de causa raiz (skill Prisma) */}
        {rootCause && (
          <div className="mb-6">
            <RootCausePanel rc={rootCause} />
          </div>
        )}

        {/* Keep / Fix */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FeedbackList title="O que MANTER" icon={<ThumbsUp size={16} className="text-emerald-600" />} items={feedback.keep_doing} tone="emerald" />
          <FeedbackList title="O que CORRIGIR" icon={<ThumbsDown size={16} className="text-rose-600" />} items={feedback.fix_doing} tone="rose" />
        </div>

        {/* Strengths / weaknesses */}
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <FeedbackList title="Pontos fortes" items={feedback.strengths} tone="emerald" />
          <FeedbackList title="Pontos fracos" items={feedback.weaknesses} tone="rose" />
        </div>

        {/* Better approach — concrete rewrite */}
        {feedback.better_approach && (
          <Card className="mb-6 border-amber-100 bg-amber-50/40">
            <CardBody>
              <div className="flex items-start gap-3">
                <Lightbulb size={20} className="shrink-0 text-amber-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Como conduzir melhor</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">{feedback.better_approach}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Criteria evaluation */}
        <Card className="mb-6">
          <CardBody>
            <SectionTitle title="Avaliação por critérios" subtitle="Nota de cada competência (0–10)" />
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {[...scores]
                .sort((a, b) => Number(b.score) - Number(a.score))
                .map((s) => (
                  <div key={s.id}>
                    <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{labelFor(s.criterion_key)}</p>
                    <ScoreBar score={Number(s.score)} />
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>

        {/* Next actions */}
        <Card>
          <CardBody>
            <SectionTitle title="Próximas ações recomendadas" subtitle="Marque como aplicada para acompanhar a evolução" />
            {actions.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">Nenhuma ação registrada.</p>
            ) : (
              <div className="space-y-3">
                {actions.map((a) => {
                  const prio = PRIORITY[(a.priority as 1 | 2 | 3)] ?? PRIORITY[2]
                  const applied = a.status === 'aplicada'
                  return (
                    <div key={a.id} className={`rounded-xl border p-3 ${applied ? 'border-emerald-200 bg-emerald-50/50' : 'border-border bg-white dark:bg-slate-900'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${prio.tone}`}>{prio.label}</span>
                            <p className={`text-sm font-semibold ${applied ? 'text-emerald-800 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{a.title}</p>
                          </div>
                          {a.detail && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{a.detail}</p>}
                        </div>
                        <form action={setActionStatus} className="shrink-0">
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="closer_id" value={call.closer_id} />
                          <input type="hidden" name="status" value={applied ? 'pendente' : 'aplicada'} />
                          <PendingButton variant={applied ? 'ghost' : 'secondary'}>
                            {applied ? <><RotateCcw size={14} /> Reabrir</> : <><Check size={14} /> Aplicada</>}
                          </PendingButton>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </>
    )
  } catch (err) {
    unstable_rethrow(err)
    return (
      <>
        <PageHeader title="Feedback" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }
}

function Backlink({ id }: { id: string }) {
  return (
    <Link href={`/calls/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white">
      <ArrowLeft size={15} /> Voltar para a call
    </Link>
  )
}

function FeedbackList({
  title,
  items,
  tone,
  icon,
}: {
  title: string
  items: string[] | null
  tone: 'emerald' | 'rose'
  icon?: React.ReactNode
}) {
  const dot = tone === 'emerald' ? 'text-emerald-500' : 'text-rose-500'
  return (
    <Card>
      <CardBody>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{icon} {title}</p>
        {!items || items.length === 0 ? (
          <p className="text-sm text-slate-400">—</p>
        ) : (
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                {it}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
