import { Sparkles, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, SubmitButton, inputCls } from '@/components/ui'
import { signIn } from '@/lib/actions/auth'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const sp = await searchParams

  return (
    <div className="fade-up mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      {/* Marca */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_8px_32px_-8px_rgba(99,102,241,0.7)]">
          <Sparkles size={26} />
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-slate-900 dark:bg-gradient-to-r dark:from-slate-50 dark:via-indigo-200 dark:to-slate-300 dark:bg-clip-text dark:text-transparent">
            Call Intelligence
          </p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-slate-400">Sales Coaching IA</p>
        </div>
      </div>

      <Card className="dark:shadow-[0_0_48px_-16px_rgba(99,102,241,0.5)]">
        <CardBody className="p-6">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bem-vindo de volta</h1>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Acesse com seu e-mail e senha.</p>

          {sp.error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {sp.error}
            </div>
          )}
          {sp.message && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {sp.message}
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">E-mail</label>
              <input name="email" type="email" required className={inputCls} placeholder="voce@empresa.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Senha</label>
              <input name="password" type="password" required minLength={6} className={inputCls} placeholder="••••••••" />
            </div>
            <div className="pt-1">
              <SubmitButton className="w-full">
                <LogIn size={16} /> Entrar
              </SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
        Acesso restrito — faça login para entrar no sistema.
      </p>
    </div>
  )
}
