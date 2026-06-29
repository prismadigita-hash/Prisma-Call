import { MessageSquare, Quote, AlertTriangle, Lightbulb } from 'lucide-react'
import { Card, CardBody, Pill } from '@/components/ui'
import type { Objecao, ObjecaoTipo, QualidadeResposta } from '@/lib/types'

const TIPO_LABEL: Record<ObjecaoTipo, string> = {
  prospeccao: 'Prospecção',
  red_herring: 'Pista falsa',
  microcompromisso: 'Microcompromisso',
  compra: 'Compra',
}
const TIPO_TONE: Record<ObjecaoTipo, 'slate' | 'amber' | 'indigo' | 'rose'> = {
  prospeccao: 'slate',
  red_herring: 'amber',
  microcompromisso: 'indigo',
  compra: 'rose',
}

const QUAL_LABEL: Record<QualidadeResposta, string> = { boa: 'Boa', mediana: 'Mediana', ruim: 'Ruim' }
function qualTone(q: QualidadeResposta): 'emerald' | 'amber' | 'rose' {
  return q === 'boa' ? 'emerald' : q === 'mediana' ? 'amber' : 'rose'
}

export function ObjectionsMapPanel({ objecoes }: { objecoes: Objecao[] }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardBody>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
            <MessageSquare size={18} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Mapa de Objeções</h3>
            <p className="text-xs text-slate-400">Cada objeção, o tipo, como foi tratada e a resposta ideal</p>
          </div>
          <Pill tone="slate">{objecoes.length} objeç{objecoes.length === 1 ? 'ão' : 'ões'}</Pill>
        </div>

        {objecoes.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/60">
            Nenhuma objeção identificada nesta call.
          </p>
        ) : (
          <div className="space-y-3">
            {objecoes.map((o, i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Pill tone={TIPO_TONE[o.tipo] ?? 'slate'}>{TIPO_LABEL[o.tipo] ?? o.tipo}</Pill>
                  <Pill tone={qualTone(o.qualidade)}>Resposta: {QUAL_LABEL[o.qualidade] ?? o.qualidade}</Pill>
                </div>

                <p className="flex gap-2 text-sm italic text-slate-700 dark:text-slate-200">
                  <Quote size={14} className="mt-0.5 shrink-0 text-slate-400" /> “{o.fala_do_lead}”
                </p>

                <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendedor respondeu</p>
                    <p className="text-slate-700 dark:text-slate-300">{o.resposta_do_vendedor}</p>
                  </div>
                  {o.problema && o.problema !== '—' && (
                    <div>
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-300">
                        <AlertTriangle size={12} /> Problema
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">{o.problema}</p>
                    </div>
                  )}
                </div>

                <div className="mt-2 rounded-lg bg-emerald-50/60 p-2.5 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    <Lightbulb size={12} /> Resposta ideal
                  </p>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{o.resposta_ideal}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
