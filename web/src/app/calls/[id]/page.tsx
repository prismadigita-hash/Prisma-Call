import Link from 'next/link'
import { notFound, unstable_rethrow } from 'next/navigation'
import { ArrowLeft, Sparkles, CheckCircle2, FileText, Clock, AlertCircle, Trash2 } from 'lucide-react'
import {
  PageHeader,
  Card,
  CardBody,
  SectionTitle,
  ScoreBadge,
  StatusBadge,
  Avatar,
  Pill,
  ButtonLink,
  EmptyState,
} from '@/components/ui'
import { PendingButton } from '@/components/pending-button'
import { RadarChart, BarList } from '@/components/charts'
import { CommercialReportPanel } from '@/components/commercial-report'
import { ObjectionsMapPanel } from '@/components/objections-map'
import { SetupBanner } from '@/components/setup-banner'
import type { CommercialReport, Objecao } from '@/lib/types'
import { getFullAnalysis, listClosers } from '@/lib/data/queries'
import { isAIEnabled } from '@/lib/ai/config'
import { labelFor, shortLabelFor } from '@/lib/criteria'
import { analyzeCallAction } from '@/lib/actions/analysis'
import { markReviewed, deleteCall } from '@/lib/actions/calls'
import { EditCallForm } from '@/components/edit-call-form'
import { ConfirmButton } from '@/components/confirm-button'
import { fmtScore, fmtDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const HIGHLIGHT_TONE: Record<string, 'rose' | 'amber' | 'emerald' | 'indigo' | 'slate'> = {
  dor: 'rose',
  objecao: 'amber',
  virada: 'emerald',
  risco: 'rose',
  momento: 'indigo',
}

export default async function CallAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const data = await getFullAnalysis(id)
    if (!data) notFound()

    const { call, closer, analysis, scores, highlights } = data
    const closers = await listClosers()
    const hasAnalysis = analysis?.status === 'concluida'
    const aiEnabled = isAIEnabled()
    const commercial = (analysis?.raw as { relatorio_comercial?: CommercialReport } | null)?.relatorio_comercial ?? null
    const objecoes = (analysis?.raw as { objecoes?: Objecao[] } | null)?.objecoes ?? null

    const radar = scores.map((s) => ({ label: shortLabelFor(s.criterion_key), value: Number(s.score) }))
    const bars = [...scores]
      .sort((a, b) => Number(a.score) - Number(b.score))
      .map((s) => ({ label: labelFor(s.criterion_key), value: Number(s.score) }))

    return (
      <>
        <Link href="/calls" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-200 dark:hover:text-white">
          <ArrowLeft size={15} /> Calls
        </Link>

        {/* Header card */}
        <Card className="mb-6">
          <CardBody className="flex flex-wrap items-center gap-4">
            <ScoreBadge score={analysis?.overall_score} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">{call.client_name}</h1>
                <StatusBadge status={call.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {closer && (
                  <Link href={`/closers/${closer.id}`} className="flex items-center gap-1.5 hover:text-indigo-600">
                    <Avatar name={closer.name} size={20} /> {closer.name}
                  </Link>
                )}
                <span className="flex items-center gap-1"><Clock size={14} /> {fmtDate(call.call_date)}</span>
                {call.recording_url && (
                  <a href={call.recording_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                    <FileText size={14} /> Gravação
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasAnalysis && <ButtonLink href={`/calls/${call.id}/feedback`} variant="primary">Ver feedback</ButtonLink>}
              {aiEnabled ? (
                <form action={analyzeCallAction}>
                  <input type="hidden" name="id" value={call.id} />
                  <PendingButton variant={hasAnalysis ? 'secondary' : 'primary'} pendingText="Analisando…">
                    <Sparkles size={16} /> {hasAnalysis ? 'Reanalisar' : 'Analisar com IA'}
                  </PendingButton>
                </form>
              ) : (
                !hasAnalysis && <Pill tone="amber">IA desativada — modo manual</Pill>
              )}
              {hasAnalysis && call.status !== 'revisada' && (
                <form action={markReviewed}>
                  <input type="hidden" name="id" value={call.id} />
                  <PendingButton variant="ghost"><CheckCircle2 size={16} /> Marcar revisada</PendingButton>
                </form>
              )}
              <form action={deleteCall}>
                <input type="hidden" name="id" value={call.id} />
                <ConfirmButton confirmMessage={`Excluir esta call (${call.client_name}) e sua análise? Esta ação não pode ser desfeita.`}>
                  <Trash2 size={16} /> Excluir
                </ConfirmButton>
              </form>
            </div>
          </CardBody>
        </Card>

        {/* Editar dados da call (Closer, cliente, data) — útil p/ calls do Tactiq */}
        <Card className="mb-6">
          <CardBody>
            <details open={!call.closer_id}>
              <summary className="cursor-pointer select-none text-sm font-semibold text-slate-700 dark:text-slate-200">
                Editar dados da call (Closer, cliente, data)
              </summary>
              <EditCallForm
                callId={call.id}
                closerId={call.closer_id}
                clientName={call.client_name}
                callDate={call.call_date}
                closers={closers.map((c) => ({ id: c.id, name: c.name }))}
              />
            </details>
          </CardBody>
        </Card>

        {analysis?.status === 'falhou' && (
          <div className="mb-6">
            <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/25 dark:bg-rose-500/10">
              <CardBody className="flex items-start gap-3 text-sm text-rose-800 dark:text-rose-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">A análise falhou</p>
                  <p className="mt-1 font-mono text-xs">{analysis.error}</p>
                  <p className="mt-1">Verifique a <code>GEMINI_API_KEY</code> em .env.local e tente reanalisar.</p>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {!hasAnalysis ? (
          <EmptyState
            title="Call ainda não analisada"
            description={
              aiEnabled
                ? 'Clique em “Analisar com IA” para gerar notas, resumo e feedback a partir da transcrição.'
                : 'IA desativada (modo manual). Defina GEMINI_API_KEY em .env.local para habilitar a análise automática.'
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Relatório comercial da oportunidade */}
            {commercial && <CommercialReportPanel report={commercial} />}

            {/* Summary + talk time */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardBody>
                  <SectionTitle title="Resumo da call" />
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{analysis.summary}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <SectionTitle title="Tempo de fala" />
                  <TalkBar closer={analysis.closer_talk_pct} client={analysis.client_talk_pct} closerName={closer?.name ?? 'Closer'} />
                </CardBody>
              </Card>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardBody>
                  <SectionTitle title="Radar de competências" subtitle="Nota por critério (0–10)" />
                  <RadarChart data={radar} />
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <SectionTitle title="Notas por critério" subtitle="Da menor para a maior" />
                  <BarList items={bars} />
                </CardBody>
              </Card>
            </div>

            {/* Score justifications */}
            <Card>
              <CardBody>
                <SectionTitle title="Avaliação detalhada" subtitle="Justificativa de cada nota" />
                <div className="divide-y divide-border">
                  {[...scores]
                    .sort((a, b) => Number(b.score) - Number(a.score))
                    .map((s) => (
                      <div key={s.id} className="flex gap-4 py-3">
                        <ScoreBadge score={Number(s.score)} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{labelFor(s.criterion_key)}</p>
                          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{s.justification}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardBody>
            </Card>

            {/* Highlights */}
            {highlights.length > 0 && (
              <Card>
                <CardBody>
                  <SectionTitle title="Momentos importantes" subtitle="Dores, objeções, viradas e riscos" />
                  <div className="space-y-3">
                    {highlights.map((h) => (
                      <div key={h.id} className="rounded-xl border border-border bg-slate-50 dark:bg-slate-800/60 p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Pill tone={HIGHLIGHT_TONE[h.kind] ?? 'slate'}>{h.kind}</Pill>
                          {h.timestamp_ref && <span className="text-xs text-slate-400">{h.timestamp_ref}</span>}
                        </div>
                        {h.quote && <p className="text-sm italic text-slate-700 dark:text-slate-300">“{h.quote}”</p>}
                        {h.comment && <p className="mt-1 text-sm text-slate-500">{h.comment}</p>}
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Mapa de objeções (skill Objeções) */}
            {objecoes && <ObjectionsMapPanel objecoes={objecoes} />}
          </div>
        )}

        {/* Transcript */}
        {call.transcript && (
          <div className="mt-6">
            <Card>
              <CardBody>
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300">Ver transcrição</summary>
                  <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 font-mono text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {call.transcript}
                  </pre>
                </details>
              </CardBody>
            </Card>
          </div>
        )}
      </>
    )
  } catch (err) {
    unstable_rethrow(err)
    return (
      <>
        <PageHeader title="Análise da call" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }
}

function TalkBar({ closer, client, closerName }: { closer: number | null; client: number | null; closerName: string }) {
  const c = closer ?? 50
  const cl = client ?? 50
  return (
    <div>
      <div className="flex h-6 overflow-hidden rounded-full">
        <div className="flex items-center justify-center bg-indigo-500 text-[10px] font-semibold text-white" style={{ width: `${c}%` }}>
          {c}%
        </div>
        <div className="flex items-center justify-center bg-slate-300 text-[10px] font-semibold text-slate-700 dark:text-slate-300" style={{ width: `${cl}%` }}>
          {cl}%
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> {closerName}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Cliente</span>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Ideal consultivo: o cliente fala mais que o Closer. Acima de ~60% de fala do Closer costuma indicar pouca escuta.
      </p>
    </div>
  )
}
