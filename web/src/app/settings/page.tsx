import { CheckCircle2, XCircle, ExternalLink, Webhook, UserPlus, Users, AlertCircle } from 'lucide-react'
import { PageHeader, Card, CardBody, SectionTitle, Pill, SubmitButton, inputCls } from '@/components/ui'
import { CopyField } from '@/components/copy-field'
import { createAuthUser } from '@/lib/actions/users'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fmtDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function ConfigRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} /> : <XCircle className="mt-0.5 shrink-0 text-slate-300" size={20} />}
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>
      <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
        {ok ? 'Configurado' : 'Pendente'}
      </span>
    </div>
  )
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ user_ok?: string; user_error?: string }>
}) {
  const sp = await searchParams

  const cfg = {
    supabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
  }

  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const tactiqUrl = `${appUrl}/api/webhooks/tactiq`
  const secretSet = Boolean(process.env.TACTIQ_WEBHOOK_SECRET)

  // Lista de usuários (Supabase Auth) — best-effort (precisa do service_role)
  let users: { id: string; email: string; created_at?: string }[] = []
  try {
    const { data } = await supabaseAdmin().auth.admin.listUsers()
    users = (data?.users ?? []).map((u) => ({ id: u.id, email: u.email ?? '(sem e-mail)', created_at: u.created_at }))
  } catch {
    // sem service_role / erro -> mantém lista vazia
  }

  return (
    <>
      <PageHeader title="Configurações" subtitle="Status das integrações e variáveis de ambiente" />

      <Card className="mb-6">
        <CardBody>
          <SectionTitle title="Integrações" subtitle="Defina os valores em .env.local e reinicie o servidor" />
          <div className="divide-y divide-border">
            <ConfigRow ok={cfg.supabaseUrl} label="Supabase — URL e chave pública" hint="SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)" />
            <ConfigRow ok={cfg.supabaseService} label="Supabase — service_role" hint="SUPABASE_SERVICE_ROLE_KEY (acesso total do backend, secreto)" />
            <ConfigRow ok={cfg.gemini} label="Gemini (Google AI)" hint="GEMINI_API_KEY — necessária para analisar calls. Vazia = modo manual (sem IA)." />
          </div>
        </CardBody>
      </Card>

      {/* Webhook do Tactiq */}
      <Card className="mb-6">
        <CardBody>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Webhook size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Webhook do Tactiq</h2>
              <p className="text-sm text-slate-500">Recebe calls transcritas e dispara a análise automaticamente</p>
            </div>
            <Pill tone={secretSet ? 'emerald' : 'amber'}>{secretSet ? 'Protegido por segredo' : 'Sem segredo'}</Pill>
          </div>

          <div className="space-y-3">
            <CopyField label="URL do webhook (use esta no Zapier/Make ou no Tactiq)" value={tactiqUrl} />
            <CopyField label="Exemplo local" value="http://localhost:3000/api/webhooks/tactiq" />
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Como usar</p>
            <ol className="mt-1 list-inside list-decimal space-y-0.5">
              <li>Método <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">POST</code> · Content-Type <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">application/json</code>.</li>
              <li>Envie o campo <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">transcricao</code> (obrigatório) + closer, cliente, empresa, data_da_call, link_da_reuniao, participantes.</li>
              <li>Em produção, a URL usa <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">NEXT_PUBLIC_APP_URL</code> automaticamente.</li>
              <li>Opcional: defina <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">TACTIQ_WEBHOOK_SECRET</code> e envie no header <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">x-webhook-secret</code>.</li>
            </ol>
            <p className="mt-2">Passo a passo completo (Tactiq + Zapier/Make) no <code className="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1">README.md</code>.</p>
          </div>
        </CardBody>
      </Card>

      {/* Usuários do sistema */}
      <Card className="mb-6">
        <CardBody>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Users size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Usuários do sistema</h2>
              <p className="text-sm text-slate-500">Crie acessos (e-mail + senha) para outras pessoas entrarem</p>
            </div>
            <Pill tone="slate">{users.length} usuário{users.length === 1 ? '' : 's'}</Pill>
          </div>

          {sp.user_ok && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {sp.user_ok}
            </div>
          )}
          {sp.user_error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {sp.user_error}
            </div>
          )}

          <form action={createAuthUser} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Nome (opcional)</label>
              <input name="full_name" className={inputCls} placeholder="Ex: João Silva" />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">E-mail *</label>
              <input name="email" type="email" required className={inputCls} placeholder="pessoa@empresa.com" />
            </div>
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Senha *</label>
              <input name="password" type="text" required minLength={6} className={inputCls} placeholder="mín. 6 caracteres" />
            </div>
            <div className="flex items-end sm:col-span-1">
              <SubmitButton className="w-full"><UserPlus size={16} /> Criar acesso</SubmitButton>
            </div>
          </form>

          {users.length > 0 && (
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="truncate text-slate-700 dark:text-slate-200">{u.email}</span>
                  <span className="shrink-0 text-xs text-slate-400">{fmtDate(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            A conta já vem confirmada — a pessoa entra direto em <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/login</code> com o e-mail e a senha.
          </p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardBody>
            <SectionTitle title="Banco de dados" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              As migrations ficam em <code className="rounded bg-slate-100 dark:bg-slate-800 px-1">supabase/migrations</code>. Rode no
              SQL Editor na ordem (0001, 0002, 0003) — ou cole o <code className="rounded bg-slate-100 dark:bg-slate-800 px-1">supabase/schema.sql</code> de uma vez.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <SectionTitle title="Links úteis" />
            <ul className="space-y-2 text-sm">
              <li><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Supabase Dashboard <ExternalLink size={13} /></a></li>
              <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Google AI Studio — API key (Gemini) <ExternalLink size={13} /></a></li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
