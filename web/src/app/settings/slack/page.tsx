import { MessageSquare, Send, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader, Card, CardBody, SectionTitle } from '@/components/ui'
import { PendingButton } from '@/components/pending-button'
import { sendTestSlack } from '@/lib/actions/slack'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fmtDate } from '@/lib/utils'
import type { SlackLog } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getLogs(): Promise<SlackLog[]> {
  try {
    const { data } = await supabaseAdmin()
      .from('slack_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15)
    return (data as SlackLog[]) ?? []
  } catch {
    return []
  }
}

export default async function SlackSettingsPage() {
  const configured = Boolean(process.env.SLACK_WEBHOOK_URL)
  const logs = await getLogs()

  return (
    <>
      <PageHeader title="Integração com Slack" subtitle="Resumo automático de cada call analisada no seu canal" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A154B] text-white">
                <MessageSquare size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Incoming Webhook</p>
                <p className={`text-xs font-medium ${configured ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {configured ? 'Configurado' : 'Não configurado'}
                </p>
              </div>
            </div>

            {configured ? (
              <form action={sendTestSlack}>
                <PendingButton pendingText="Enviando…" className="w-full"><Send size={16} /> Enviar mensagem de teste</PendingButton>
              </form>
            ) : (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                Defina <code className="rounded bg-slate-200 px-1">SLACK_WEBHOOK_URL</code> em{' '}
                <code className="rounded bg-slate-200 px-1">.env.local</code> e reinicie o servidor.
              </div>
            )}

            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <p className="font-semibold text-slate-600">O resumo inclui:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Closer, cliente e data</li>
                <li>Nota geral</li>
                <li>Resumo rápido</li>
                <li>Pontos positivos e de melhoria</li>
                <li>Ações recomendadas</li>
                <li>Link para a análise completa</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* Logs */}
        <Card className="lg:col-span-2">
          <CardBody>
            <SectionTitle title="Histórico de envios" subtitle="Auditoria das últimas notificações" />
            {logs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Nenhum envio registrado ainda.</p>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-3">
                    {log.ok ? <CheckCircle2 size={18} className="text-emerald-500" /> : <XCircle size={18} className="text-rose-500" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{log.ok ? 'Enviado com sucesso' : 'Falha no envio'}</p>
                      {log.error && <p className="truncate font-mono text-xs text-rose-500">{log.error}</p>}
                    </div>
                    <span className="text-xs text-slate-400">{log.channel}</span>
                    <span className="text-xs text-slate-400">{fmtDate(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
