import Link from 'next/link'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { PageHeader, Card, CardBody, SectionTitle } from '@/components/ui'

export const dynamic = 'force-dynamic'

function ConfigRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {ok ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} /> : <XCircle className="mt-0.5 shrink-0 text-slate-300" size={20} />}
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>
      <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
        {ok ? 'Configurado' : 'Pendente'}
      </span>
    </div>
  )
}

export default function SettingsPage() {
  const cfg = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseService: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    slack: Boolean(process.env.SLACK_WEBHOOK_URL),
  }

  return (
    <>
      <PageHeader title="Configurações" subtitle="Status das integrações e variáveis de ambiente" />

      <Card className="mb-6">
        <CardBody>
          <SectionTitle title="Integrações" subtitle="Defina os valores em .env.local e reinicie o servidor" />
          <div className="divide-y divide-border">
            <ConfigRow ok={cfg.supabaseUrl} label="Supabase — URL e chave pública" hint="NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY" />
            <ConfigRow ok={cfg.supabaseService} label="Supabase — service_role" hint="SUPABASE_SERVICE_ROLE_KEY (acesso total do backend, secreto)" />
            <ConfigRow ok={cfg.gemini} label="Gemini (Google AI)" hint="GEMINI_API_KEY — necessária para analisar calls. Vazia = modo manual (sem IA)." />
            <ConfigRow ok={cfg.slack} label="Slack — Incoming Webhook" hint="SLACK_WEBHOOK_URL — envio automático de resumos" />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardBody>
            <SectionTitle title="Banco de dados" />
            <p className="text-sm text-slate-600">
              As migrations ficam em <code className="rounded bg-slate-100 px-1">supabase/migrations</code>. Rode os dois
              arquivos no SQL Editor do seu projeto, na ordem (0001 e 0002).
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <SectionTitle title="Links úteis" />
            <ul className="space-y-2 text-sm">
              <li><a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Supabase Dashboard <ExternalLink size={13} /></a></li>
              <li><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Google AI Studio — API key (Gemini) <ExternalLink size={13} /></a></li>
              <li><a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Slack Incoming Webhooks <ExternalLink size={13} /></a></li>
              <li><Link href="/settings/slack" className="text-indigo-600 hover:underline">Configurar e testar Slack →</Link></li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
