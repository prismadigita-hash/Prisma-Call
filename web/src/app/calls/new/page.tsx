import Link from 'next/link'
import { ArrowLeft, Sparkles, Upload } from 'lucide-react'
import { PageHeader, Card, CardBody, SectionTitle } from '@/components/ui'
import { PendingButton } from '@/components/pending-button'
import { SetupBanner } from '@/components/setup-banner'
import { listClosers } from '@/lib/data/queries'
import { createCall } from '@/lib/actions/calls'
import { isAIEnabled } from '@/lib/ai/config'

export const dynamic = 'force-dynamic'

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

export default async function NewCallPage() {
  let closers
  try {
    closers = await listClosers()
  } catch (err) {
    return (
      <>
        <PageHeader title="Nova call" />
        <SetupBanner error={err instanceof Error ? err.message : undefined} />
      </>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const aiEnabled = isAIEnabled()

  return (
    <>
      <Link href="/calls" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} /> Calls
      </Link>
      <PageHeader title="Nova call" subtitle="Cadastre uma call e gere a análise por IA" />

      {closers.length === 0 ? (
        <SetupBanner error="Cadastre um Closer antes de criar uma call (página Closers)." />
      ) : (
        <Card className="max-w-2xl">
          <CardBody>
            <form action={createCall} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Closer *</label>
                  <select name="closer_id" required className={inputCls} defaultValue="">
                    <option value="" disabled>Selecione…</option>
                    {closers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Data da call *</label>
                  <input type="date" name="call_date" required defaultValue={today} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Cliente / Lead *</label>
                <input name="client_name" required className={inputCls} placeholder="Ex: Empresa XPTO — Maria" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Link da gravação (opcional)</label>
                <input name="recording_url" type="url" className={inputCls} placeholder="https://…" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Transcrição</label>

                {/* Upload de arquivo */}
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                  <p className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                    <Upload size={16} className="text-slate-400" />
                    <span><span className="font-medium text-slate-700">Anexar arquivo</span> — .txt, .md, .vtt, .srt (máx. 2 MB)</span>
                  </p>
                  <input
                    type="file"
                    name="transcript_file"
                    accept=".txt,.md,.vtt,.srt,.text,text/plain"
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
                  />
                </div>

                <p className="my-2 text-center text-[11px] uppercase tracking-wide text-slate-300">ou cole o texto</p>

                <textarea
                  name="transcript"
                  rows={9}
                  className={inputCls + ' font-mono text-xs leading-relaxed'}
                  placeholder={'Cole aqui a transcrição da call.\n\nDica: marque quem fala, ex:\nCloser: ...\nCliente: ...'}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Se anexar um arquivo, ele tem prioridade sobre o texto colado. Legendas (.vtt/.srt) têm os tempos
                  removidos automaticamente. Áudio/vídeo (transcrição automática) entram na fase 2.
                </p>
              </div>

              {aiEnabled ? (
                <label className="flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-800">
                  <input type="checkbox" name="analyze_now" defaultChecked className="h-4 w-4 rounded border-slate-300" />
                  <span className="flex items-center gap-1.5 font-medium"><Sparkles size={15} /> Analisar com IA (Gemini) imediatamente após salvar</span>
                </label>
              ) : (
                <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium"><Sparkles size={15} /> Modo manual: IA desativada.</span>
                  <p className="mt-1 text-xs">Defina <code className="rounded bg-slate-200 px-1">GEMINI_API_KEY</code> em .env.local para habilitar a análise automática. A call será salva como pendente.</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <PendingButton pendingText={aiEnabled ? 'Salvando e analisando…' : 'Salvando…'}>Salvar call</PendingButton>
                <Link href="/calls" className="text-sm text-slate-500 hover:text-slate-800">Cancelar</Link>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </>
  )
}
