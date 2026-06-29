'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAIEnabled } from '@/lib/ai/config'
import { parseTranscriptText, MAX_TRANSCRIPT_BYTES } from '@/lib/transcript'
import type { CallSource } from '@/lib/types'

export async function createCall(formData: FormData) {
  const closer_id = String(formData.get('closer_id') ?? '')
  const client_name = String(formData.get('client_name') ?? '').trim()
  const call_date = String(formData.get('call_date') ?? '') || new Date().toISOString().slice(0, 10)
  const recording_url = String(formData.get('recording_url') ?? '').trim() || null
  const pasted = String(formData.get('transcript') ?? '').trim()
  const analyzeNow = String(formData.get('analyze_now') ?? '') === 'on'

  // A transcript can come from an uploaded file OR pasted text (file wins).
  let transcript: string | null = pasted || null
  const file = formData.get('transcript_file')
  if (file && typeof file !== 'string' && file.size > 0) {
    if (file.size > MAX_TRANSCRIPT_BYTES) {
      throw new Error('Arquivo de transcrição muito grande (máx. 2 MB).')
    }
    const raw = await file.text()
    const parsed = parseTranscriptText(file.name, raw)
    if (!parsed.ok) throw new Error(parsed.error)
    transcript = parsed.text
  }

  if (!closer_id) throw new Error('Selecione um Closer.')
  if (!client_name) throw new Error('Informe o cliente/lead.')
  if (!transcript && !recording_url) throw new Error('Cole a transcrição, anexe um arquivo ou informe um link da gravação.')

  const source: CallSource = transcript ? 'transcricao' : 'link'

  const { data, error } = await supabaseAdmin()
    .from('calls')
    .insert({ closer_id, client_name, call_date, recording_url, transcript, source, status: 'pendente' })
    .select('id')
    .single()
  if (error) throw error

  revalidatePath('/calls')
  revalidatePath('/')

  // If requested, we have a transcript, and AI is enabled, kick off analysis.
  if (analyzeNow && transcript && isAIEnabled()) {
    const { runAnalysis } = await import('./analysis')
    await runAnalysis(data.id)
  }

  redirect(`/calls/${data.id}`)
}

/**
 * Atualiza os dados "crus" de uma call (útil p/ calls vindas do Tactiq):
 * Closer, cliente e data. Mantém a análise existente; só corrige a atribuição.
 * Também sincroniza o closer_id das ações de melhoria dessa call (métricas).
 */
export async function updateCall(formData: FormData) {
  const id = String(formData.get('id'))
  const closer_id = String(formData.get('closer_id') ?? '').trim() || null
  const client_name = String(formData.get('client_name') ?? '').trim()
  const call_date = String(formData.get('call_date') ?? '').trim()

  const patch: Record<string, string> = {}
  if (closer_id) patch.closer_id = closer_id
  if (client_name) patch.client_name = client_name
  if (call_date) patch.call_date = call_date

  if (Object.keys(patch).length === 0) return

  const db = supabaseAdmin()
  const { error } = await db.from('calls').update(patch).eq('id', id)
  if (error) throw error

  // Reatribui as ações de melhoria dessa call ao novo Closer (para a evolução)
  if (closer_id) {
    const { data: analyses } = await db.from('call_analyses').select('id').eq('call_id', id)
    const ids = (analyses ?? []).map((a) => a.id)
    if (ids.length) {
      await db.from('improvement_actions').update({ closer_id }).in('analysis_id', ids)
    }
  }

  revalidatePath(`/calls/${id}`)
  revalidatePath('/calls')
  revalidatePath('/')
  if (closer_id) revalidatePath(`/closers/${closer_id}`)
}

export async function deleteCall(formData: FormData) {
  const id = String(formData.get('id'))
  const { error } = await supabaseAdmin().from('calls').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/calls')
  revalidatePath('/')
  redirect('/calls')
}

export async function markReviewed(formData: FormData) {
  const id = String(formData.get('id'))
  const { error } = await supabaseAdmin().from('calls').update({ status: 'revisada' }).eq('id', id)
  if (error) throw error
  revalidatePath(`/calls/${id}`)
  revalidatePath('/calls')
}
