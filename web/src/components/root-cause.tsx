import { Crosshair, AlertTriangle, Wrench, ShieldCheck, MessageSquare, ArrowRight, Target } from 'lucide-react'
import { Card, CardBody, Pill } from '@/components/ui'
import type { RootCause, Nivel, EtapaFunil } from '@/lib/types'

const ETAPA_LABEL: Record<EtapaFunil, string> = {
  anuncio: 'Anúncio',
  lead: 'Lead',
  whatsapp: 'WhatsApp',
  ligacao: 'Ligação',
  qualificacao: 'Qualificação',
  reuniao: 'Reunião',
  proposta: 'Proposta',
  objecao: 'Objeção',
  follow_up: 'Follow-up',
  decisao: 'Decisão',
}

const NIVEL_LABEL: Record<Nivel, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }

function gravidadeTone(n: Nivel): 'rose' | 'amber' | 'emerald' {
  return n === 'alto' ? 'rose' : n === 'medio' ? 'amber' : 'emerald'
}
function confiancaTone(n: Nivel): 'emerald' | 'amber' | 'slate' {
  return n === 'alto' ? 'emerald' : n === 'medio' ? 'amber' : 'slate'
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon} {title}
      </p>
      <p className="text-sm leading-relaxed text-slate-700">{children}</p>
    </div>
  )
}

export function RootCausePanel({ rc }: { rc: RootCause }) {
  return (
    <Card className="border-slate-200">
      <CardBody>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Crosshair size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Diagnóstico de Causa Raiz</h3>
              <p className="text-xs text-slate-400">Método Prisma · análise consultiva</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={gravidadeTone(rc.gravidade)}>Gravidade: {NIVEL_LABEL[rc.gravidade]}</Pill>
            <Pill tone={confiancaTone(rc.confianca)}>Confiança: {NIVEL_LABEL[rc.confianca]}</Pill>
            <Pill tone="indigo">Quebrou em: {ETAPA_LABEL[rc.etapa_quebrou] ?? rc.etapa_quebrou}</Pill>
          </div>
        </div>

        {/* Diagnóstico direto */}
        <div className="mb-5 rounded-xl bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Diagnóstico direto</p>
          {rc.diagnostico_direto}
        </div>

        {/* Sintoma → aparente → raiz */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Block icon={<AlertTriangle size={13} className="text-amber-500" />} title="Sintoma">{rc.sintoma}</Block>
          <Block icon={<AlertTriangle size={13} className="text-slate-400" />} title="Causa aparente">{rc.causa_aparente}</Block>
          <div className="rounded-xl bg-rose-50 p-3 ring-1 ring-inset ring-rose-100">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600">
              <Crosshair size={13} /> Causa raiz
            </p>
            <p className="text-sm font-medium leading-relaxed text-rose-900">{rc.causa_raiz}</p>
          </div>
        </div>

        {/* Causas secundárias + categorias */}
        {(rc.causas_secundarias.length > 0 || rc.categorias_causa.length > 0) && (
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {rc.causas_secundarias.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Causas secundárias</p>
                <ul className="space-y-1">
                  {rc.causas_secundarias.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {rc.categorias_causa.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Categorias de causa</p>
                <div className="flex flex-wrap gap-1.5">
                  {rc.categorias_causa.map((c, i) => (
                    <Pill key={i} tone="slate">{c}</Pill>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Correção */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Block icon={<Target size={13} className="text-indigo-500" />} title="O que deveria ter acontecido">
            {rc.o_que_deveria_ter_acontecido}
          </Block>
          <Block icon={<Wrench size={13} className="text-amber-600" />} title="Como corrigir agora">
            {rc.como_corrigir_agora}
          </Block>
          <Block icon={<ShieldCheck size={13} className="text-emerald-600" />} title="Como prevenir">
            {rc.como_prevenir}
          </Block>
        </div>

        {/* Mensagem recomendada */}
        {rc.mensagem_recomendada?.trim() && (
          <div className="mb-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              <MessageSquare size={13} /> Mensagem / fala recomendada
            </p>
            <p className="whitespace-pre-line text-sm italic leading-relaxed text-slate-800">“{rc.mensagem_recomendada}”</p>
          </div>
        )}

        {/* Próximo passo */}
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-100">
          <ArrowRight size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <span><span className="font-semibold">Próximo passo:</span> {rc.proximo_passo}</span>
        </div>
      </CardBody>
    </Card>
  )
}
