'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react'
import { inputCls } from '@/components/ui'

interface CloserOption {
  id: string
  name: string
}

// Formulário de edição da call (Closer, cliente, data) via rota de API + fetch.
// Não usa Server Action de propósito: sobrevive a deploys com a aba aberta,
// responde rápido e dá feedback visual claro de sucesso/erro.
export function EditCallForm({
  callId,
  closerId,
  clientName,
  callDate,
  closers,
}: {
  callId: string
  closerId: string | null
  clientName: string
  callDate: string
  closers: CloserOption[]
}) {
  const router = useRouter()
  const [closer, setCloser] = useState(closerId ?? '')
  const [name, setName] = useState(clientName)
  const [date, setDate] = useState(callDate)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSave() {
    setState('saving')
    setErrorMsg('')
    try {
      const res = await fetch('/api/calls/update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: callId, closer_id: closer, client_name: name, call_date: date }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error || `Falha ao salvar (HTTP ${res.status}).`)
      setState('saved')
      router.refresh()
      setTimeout(() => setState((s) => (s === 'saved' ? 'idle' : s)), 2500)
    } catch (err) {
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado ao salvar.')
    }
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Closer</label>
        <select value={closer} onChange={(e) => setCloser(e.target.value)} className={inputCls}>
          <option value="">Selecione…</option>
          {closers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Cliente / Lead</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Data da call</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </div>

      <div className="flex items-center gap-3 sm:col-span-3">
        <button
          onClick={handleSave}
          disabled={state === 'saving'}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
        >
          {state === 'saving' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {state === 'saving' ? 'Salvando…' : 'Salvar dados'}
        </button>

        {state === 'saved' && (
          <span className="fade-up inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/25">
            <CheckCircle2 size={14} /> Salvo!
          </span>
        )}
        {state === 'error' && (
          <span className="fade-up inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25">
            <AlertCircle size={14} /> {errorMsg}
          </span>
        )}
      </div>
    </div>
  )
}
