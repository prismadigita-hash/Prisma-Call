import { PageHeader, Card, CardBody, Pill } from '@/components/ui'
import { SetupBanner } from '@/components/setup-banner'
import { listCriteria } from '@/lib/data/queries'
import { RUBRIC, RUBRIC_VERSION } from '@/lib/criteria'

export const dynamic = 'force-dynamic'

export default async function CriteriaPage() {
  // Prefer DB criteria; fall back to the static rubric if the table is empty/unset.
  let criteria
  try {
    const fromDb = await listCriteria()
    criteria = fromDb.length ? fromDb : RUBRIC.map((c, i) => ({ ...c, id: c.key, active: true, version: RUBRIC_VERSION, sort_order: i, created_at: '' }))
  } catch {
    criteria = RUBRIC.map((c, i) => ({ ...c, id: c.key, active: true, version: RUBRIC_VERSION, sort_order: i, created_at: '' }))
  }

  return (
    <>
      <PageHeader
        title="Critérios de avaliação"
        subtitle={`Rubrica usada pela IA para pontuar cada call · versão ${RUBRIC_VERSION}`}
      />

      <Card className="mb-5 border-indigo-100 bg-indigo-50/40">
        <CardBody className="text-sm text-slate-700 dark:text-slate-300">
          Cada critério recebe uma nota de <strong>0 a 10</strong>. A nota geral é a média ponderada pelos pesos
          abaixo. Editar a rubrica pela interface entra na fase 2 — por ora, ajuste em{' '}
          <code className="rounded bg-indigo-100 px-1">supabase/migrations/0002_seed_criteria.sql</code> e em{' '}
          <code className="rounded bg-indigo-100 px-1">src/lib/criteria.ts</code>.
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {criteria.map((c, i) => (
          <Card key={c.id}>
            <CardBody className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-500">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.label}</p>
                  <Pill tone="indigo">peso {Number(c.weight).toFixed(1)}</Pill>
                </div>
                <p className="mt-1 text-sm text-slate-500">{c.description}</p>
                <p className="mt-1.5 font-mono text-[11px] text-slate-400">{c.key}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  )
}
