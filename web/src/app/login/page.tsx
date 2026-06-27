import { Sparkles, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, SubmitButton } from '@/components/ui'
import { signIn } from '@/lib/actions/auth'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 dark:text-slate-100">Call Intelligence</p>
          <p className="text-xs text-slate-400">Sales Coaching IA</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Entrar</h1>
          <p className="mb-4 text-sm text-slate-500">Acesse com seu e-mail e senha.</p>

          {sp.error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {sp.error}
            </div>
          )}
          {sp.message && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {sp.message}
            </div>
          )}

          <form action={signIn} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">E-mail</label>
              <input name="email" type="email" required className={inputCls} placeholder="voce@empresa.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Senha</label>
              <input name="password" type="password" required minLength={6} className={inputCls} placeholder="••••••••" />
            </div>
            <div className="pt-1">
              <SubmitButton className="w-full"><LogIn size={16} /> Entrar</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-xs text-slate-400">
        Acesso restrito — faça login para entrar no sistema.
      </p>
    </div>
  )
}
