import { Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, SubmitButton } from '@/components/ui'
import { signIn, signUp } from '@/lib/actions/auth'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

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
          <p className="text-base font-bold text-slate-900">Call Intelligence</p>
          <p className="text-xs text-slate-400">Sales Coaching IA</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <h1 className="text-lg font-semibold text-slate-900">Entrar</h1>
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

          <form className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">E-mail</label>
              <input name="email" type="email" required className={inputCls} placeholder="voce@empresa.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Senha</label>
              <input name="password" type="password" required minLength={6} className={inputCls} placeholder="••••••••" />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <SubmitButton formAction={signIn} className="w-full"><LogIn size={16} /> Entrar</SubmitButton>
              <SubmitButton formAction={signUp} variant="secondary" className="w-full"><UserPlus size={16} /> Criar conta</SubmitButton>
            </div>
          </form>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-xs text-slate-400">
        Autenticação opcional nesta fase — o sistema continua acessível sem login até a ativação completa.
      </p>
    </div>
  )
}
