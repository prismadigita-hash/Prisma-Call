import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { PageHeader, Card, CardBody, SectionTitle, Avatar, ScoreBar, TrendPill, SubmitButton } from '@/components/ui'
import { SetupBanner } from '@/components/setup-banner'
import { listClosers } from '@/lib/data/queries'
import { getDashboardMetrics } from '@/lib/data/metrics'
import { createCloser } from '@/lib/actions/closers'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default async function ClosersPage() {
  try {
    const [closers, metrics] = await Promise.all([listClosers(), getDashboardMetrics()])

    return (
      <>
        <PageHeader title="Closers" subtitle="Cadastro e performance dos vendedores" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* List */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody>
                <SectionTitle title={`${closers.length} Closers`} />
                {closers.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">Cadastre o primeiro Closer ao lado.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {closers.map((c) => {
                      const m = metrics.byCloser[c.id]
                      return (
                        <Link key={c.id} href={`/closers/${c.id}`} className="flex items-center gap-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <Avatar name={c.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.role ?? 'Closer'} · {m?.callsAnalyzed ?? 0} calls</p>
                          </div>
                          <div className="w-40">
                            <ScoreBar score={m?.avgOverall ?? null} />
                          </div>
                          {m?.evolutionPct != null && <TrendPill value={m.evolutionPct} />}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Create form */}
          <div>
            <Card>
              <CardBody>
                <SectionTitle title="Novo Closer" />
                <form action={createCloser} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Nome *</label>
                    <input name="name" required className={inputCls} placeholder="Ex: João Silva" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">E-mail</label>
                    <input name="email" type="email" className={inputCls} placeholder="joao@empresa.com" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Cargo</label>
                    <input name="role" className={inputCls} placeholder="Closer" defaultValue="Closer" />
                  </div>
                  <SubmitButton className="w-full">
                    <UserPlus size={16} /> Cadastrar Closer
                  </SubmitButton>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      </>
    )
  } catch (err) {
    return (
      <>
        <PageHeader title="Closers" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }
}
