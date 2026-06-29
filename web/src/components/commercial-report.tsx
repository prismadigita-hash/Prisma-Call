import { Briefcase, TrendingUp, ThumbsUp, ShieldAlert, ArrowRight, User, FileText, CalendarClock } from 'lucide-react'
import { Card, CardBody, Pill } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CommercialReport, MomentoCompra, TemperaturaLead, Nivel } from '@/lib/types'

const MOMENTO_LABEL: Record<MomentoCompra, string> = {
  apenas_pesquisando: 'Apenas pesquisando',
  comparando_preco: 'Comparando preço',
  pediu_orcamento: 'Pediu orçamento',
  demonstrou_interesse_real: 'Interesse real',
  perto_do_fechamento: 'Perto do fechamento',
  pronto_para_fechar: 'Pronto para fechar',
  nao_identificado: 'Não identificado',
}

const TEMP: Record<TemperaturaLead, { label: string; cls: string; emoji: string }> = {
  frio: { label: 'Frio', cls: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25', emoji: '🧊' },
  morno: { label: 'Morno', cls: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25', emoji: '🌤️' },
  quente: { label: 'Quente', cls: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/25', emoji: '🔥' },
  muito_quente: { label: 'Muito quente', cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25', emoji: '🔥🔥' },
}

const RISCO_LABEL: Record<Nivel, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }
function riscoTone(n: Nivel): 'emerald' | 'amber' | 'rose' {
  return n === 'alto' ? 'rose' : n === 'medio' ? 'amber' : 'emerald'
}

function probColor(p: number): string {
  if (p >= 70) return 'bg-emerald-500'
  if (p >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}
function probText(p: number): string {
  if (p >= 70) return 'text-emerald-600'
  if (p >= 40) return 'text-amber-600'
  return 'text-rose-600'
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon} {title}
      </p>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>
    </div>
  )
}

export function CommercialReportPanel({ report }: { report: CommercialReport }) {
  const temp = TEMP[report.temperatura_do_lead] ?? TEMP.frio
  const prob = Math.max(0, Math.min(100, report.probabilidade_estimada_de_fechamento))
  const dataPasso = (report.data_proximo_passo ?? '').trim()
  const agendado = dataPasso.length > 0 && !/n[ãa]o identificad/i.test(dataPasso)

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardBody>
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Briefcase size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Relatório Comercial da Oportunidade</h3>
              <p className="text-xs text-slate-400">Visão do cliente e chance de venda</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', temp.cls)}>
              {temp.emoji} {temp.label}
            </span>
            <Pill tone="indigo">{MOMENTO_LABEL[report.momento_de_compra] ?? report.momento_de_compra}</Pill>
            <Pill tone={riscoTone(report.risco_de_perda)}>Risco de perda: {RISCO_LABEL[report.risco_de_perda]}</Pill>
            {agendado ? (
              <Pill tone="emerald">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={12} /> Próximo passo: {dataPasso}
                </span>
              </Pill>
            ) : (
              <Pill tone="amber">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={12} /> Sem data marcada
                </span>
              </Pill>
            )}
          </div>
        </div>

        {/* Probabilidade de fechamento */}
        <div className="mb-5 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/60 p-4">
          <div className="mb-2 flex items-end justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <TrendingUp size={13} /> Probabilidade estimada de fechamento
            </p>
            <span className={cn('text-2xl font-bold tabular-nums', probText(prob))}>{prob}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:bg-slate-700">
            <div className={cn('h-full rounded-full', probColor(prob))} style={{ width: `${prob}%` }} />
          </div>
          {report.probabilidade_justificativa && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{report.probabilidade_justificativa}</p>
          )}
        </div>

        {/* Contexto + resumo */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Block icon={<User size={13} className="text-indigo-500" />} title="Contexto do cliente">
            {report.contexto_do_cliente}
          </Block>
          <Block icon={<FileText size={13} className="text-slate-400" />} title="Resumo da reunião">
            {report.resumo_da_reuniao}
          </Block>
        </div>

        {/* Sinais x objeções */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-emerald-50/50 p-3 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              <ThumbsUp size={13} /> Sinais de compra
            </p>
            {report.sinais_de_compra.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum identificado.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {report.sinais_de_compra.map((s, i) => (
                  <Pill key={i} tone="emerald">{s}</Pill>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-rose-50/50 p-3 ring-1 ring-inset ring-rose-100 dark:bg-rose-500/10 dark:ring-rose-500/20">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700">
              <ShieldAlert size={13} /> Objeções / travas
            </p>
            {report.objecoes_ou_travas.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma identificada.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {report.objecoes_ou_travas.map((o, i) => (
                  <Pill key={i} tone="rose">{o}</Pill>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risco motivo */}
        {report.risco_de_perda_motivo && (
          <div className="mb-5">
            <Block icon={<ShieldAlert size={13} className="text-amber-600" />} title="Motivo do risco de perda">
              {report.risco_de_perda_motivo}
            </Block>
          </div>
        )}

        {/* Diagnóstico comercial final */}
        <div className="mb-5 rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Diagnóstico comercial final</p>
          {report.diagnostico_comercial_final}
        </div>

        {/* Próximo passo ideal */}
        <div className="flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900 ring-1 ring-inset ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/20">
          <ArrowRight size={16} className="mt-0.5 shrink-0 text-indigo-600" />
          <span><span className="font-semibold">Próximo passo ideal:</span> {report.proximo_passo_ideal}</span>
        </div>
      </CardBody>
    </Card>
  )
}
