'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyzeCall } from '@/lib/ai/analyze'
import { isAIEnabled, AI_DISABLED_MESSAGE } from '@/lib/ai/config'
import { RUBRIC_VERSION, weightedOverall } from '@/lib/criteria'
import type { ActionStatus } from '@/lib/types'

/**
 * Full analysis pipeline for a call:
 *   load → AI analyze → persist (analysis, scores, highlights, feedback, actions)
 *   → update statuses.
 * Keeps a single current analysis per call (old ones are replaced).
 */
export async function runAnalysis(
  callId: string,
  opts: { autoRename?: boolean } = {},
): Promise<{ ok: boolean; error?: string }> {
  // Manual mode: no AI key configured. Don't touch statuses; just report back.
  if (!isAIEnabled()) {
    return { ok: false, error: AI_DISABLED_MESSAGE }
  }

  const db = supabaseAdmin()

  const { data: call, error: callErr } = await db
    .from('calls')
    .select('*, closer:closers(id, name)')
    .eq('id', callId)
    .single()
  if (callErr || !call) return { ok: false, error: 'Call não encontrada.' }

  const transcript: string | null = call.transcript
  const closerName: string = call.closer?.name ?? 'Closer'

  if (!transcript || transcript.trim().length < 40) {
    return { ok: false, error: 'Transcrição ausente ou muito curta para analisar.' }
  }

  // Mark in-progress and reset previous analyses for a clean current state.
  await db.from('calls').update({ status: 'em_analise' }).eq('id', callId)
  await db.from('call_analyses').delete().eq('call_id', callId)

  const { data: analysis, error: insErr } = await db
    .from('call_analyses')
    .insert({ call_id: callId, status: 'em_analise', rubric_version: RUBRIC_VERSION })
    .select('id')
    .single()
  if (insErr || !analysis) return { ok: false, error: 'Falha ao criar análise.' }

  try {
    const { data: ai, model } = await analyzeCall({
      closerName,
      clientName: call.client_name,
      callDate: call.call_date,
      transcript,
    })

    // Nota geral = média ponderada das notas por critério (estável e coerente
    // com o radar). Cai para a nota do modelo só se não houver scores.
    const overall =
      weightedOverall(ai.scores.map((s) => ({ criterion_key: s.criterion_key, score: s.score }))) ??
      ai.overall_score

    // Auto-nomeação: se a IA identificou empresa/pessoa na transcrição, renomeia a
    // call. Com opts.autoRename (webhook: call recém-transcrita) renomeia sempre;
    // sem a flag (re-análise manual) só quando o nome atual é genérico/automático,
    // para não sobrescrever um nome que alguém digitou à mão.
    const aiTitle = (ai.call_title ?? '').trim()
    const hasAiTitle = aiTitle && aiTitle.toLowerCase() !== 'não identificado' && aiTitle.length <= 80
    const currentName = (call.client_name ?? '').trim()
    const genericName =
      !currentName ||
      /^cliente n[aã]o informado$/i.test(currentName) ||
      /^(meeting|meet\b|reuni[aã]o|gravação|call\b|transcri|notas d)/i.test(currentName)
    if (hasAiTitle && (opts.autoRename || genericName) && aiTitle !== currentName) {
      await db.from('calls').update({ client_name: aiTitle }).eq('id', callId)
    }

    // Persist the analysis core
    await db
      .from('call_analyses')
      .update({
        status: 'concluida',
        overall_score: overall,
        summary: ai.summary,
        closer_talk_pct: ai.closer_talk_pct,
        client_talk_pct: ai.client_talk_pct,
        model,
        raw: ai,
      })
      .eq('id', analysis.id)

    // Scores
    if (ai.scores.length) {
      await db.from('scores').insert(
        ai.scores.map((s) => ({
          analysis_id: analysis.id,
          criterion_key: s.criterion_key,
          score: s.score,
          justification: s.justification,
        })),
      )
    }

    // Highlights
    if (ai.highlights.length) {
      await db.from('call_highlights').insert(
        ai.highlights.map((h) => ({
          analysis_id: analysis.id,
          kind: h.kind,
          timestamp_ref: h.timestamp_ref ?? null,
          quote: h.quote,
          comment: h.comment,
        })),
      )
    }

    // Feedback
    await db.from('feedbacks').insert({
      analysis_id: analysis.id,
      strengths: ai.feedback.strengths,
      weaknesses: ai.feedback.weaknesses,
      keep_doing: ai.feedback.keep_doing,
      fix_doing: ai.feedback.fix_doing,
      final_comment: ai.feedback.final_comment,
      better_approach: ai.feedback.better_approach,
    })

    // Improvement actions
    if (ai.actions.length) {
      await db.from('improvement_actions').insert(
        ai.actions.map((a) => ({
          analysis_id: analysis.id,
          closer_id: call.closer_id,
          title: a.title,
          detail: a.detail,
          priority: a.priority,
        })),
      )
    }

    await db.from('calls').update({ status: 'concluida' }).eq('id', callId)

    revalidatePath(`/calls/${callId}`)
    revalidatePath('/calls')
    revalidatePath('/')
    revalidatePath(`/closers/${call.closer_id}`)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido na análise.'
    await db.from('call_analyses').update({ status: 'falhou', error: message }).eq('id', analysis.id)
    await db.from('calls').update({ status: 'pendente' }).eq('id', callId)
    revalidatePath(`/calls/${callId}`)
    return { ok: false, error: message }
  }
}

/** Action wrapper for forms/buttons. */
export async function analyzeCallAction(formData: FormData) {
  const callId = String(formData.get('id'))
  await runAnalysis(callId)
  revalidatePath(`/calls/${callId}`)
}

/** Update an improvement action's status (drives "feedbacks aplicados"). */
export async function setActionStatus(formData: FormData) {
  const id = String(formData.get('id'))
  const status = String(formData.get('status')) as ActionStatus
  const closerId = String(formData.get('closer_id') ?? '')
  const { error } = await supabaseAdmin().from('improvement_actions').update({ status }).eq('id', id)
  if (error) throw error
  revalidatePath('/calls')
  if (closerId) revalidatePath(`/closers/${closerId}`)
}
