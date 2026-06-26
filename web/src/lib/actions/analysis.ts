'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { analyzeCall } from '@/lib/ai/analyze'
import type { AiRelatorioComercial } from '@/lib/ai/schema'
import { isAIEnabled, AI_DISABLED_MESSAGE } from '@/lib/ai/config'
import { sendSlackSummary } from '@/lib/slack/notify'
import { RUBRIC_VERSION } from '@/lib/criteria'
import type { ActionStatus } from '@/lib/types'

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return base.replace(/\/$/, '') + path
}

/**
 * Full analysis pipeline for a call:
 *   load → AI analyze → persist (analysis, scores, highlights, feedback, actions)
 *   → notify Slack → update statuses.
 * Keeps a single current analysis per call (old ones are replaced).
 */
export async function runAnalysis(callId: string): Promise<{ ok: boolean; error?: string }> {
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

    // Persist the analysis core
    await db
      .from('call_analyses')
      .update({
        status: 'concluida',
        overall_score: ai.overall_score,
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

    // Notify Slack (best-effort; always logged)
    await notifySlack(callId)

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

/** Build the Slack summary from the persisted analysis and send it. */
export async function notifySlack(callId: string): Promise<{ ok: boolean; error: string | null }> {
  const db = supabaseAdmin()

  const { data: call } = await db
    .from('calls')
    .select('*, closer:closers(name)')
    .eq('id', callId)
    .single()
  if (!call) return { ok: false, error: 'Call não encontrada.' }

  const { data: analysis } = await db
    .from('call_analyses')
    .select('*, feedbacks(*), improvement_actions(title, priority)')
    .eq('call_id', callId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (!analysis) return { ok: false, error: 'Análise não encontrada.' }

  const feedback = analysis.feedbacks?.[0] ?? analysis.feedbacks ?? {}
  const actions = (analysis.improvement_actions ?? [])
    .sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority)
    .map((a: { title: string }) => a.title)

  // Resumo comercial (vem da saída da IA guardada em raw).
  const rc = (analysis.raw as { relatorio_comercial?: AiRelatorioComercial } | null)?.relatorio_comercial
  const commercial = rc
    ? {
        temperatura: rc.temperatura_do_lead,
        probabilidade: rc.probabilidade_estimada_de_fechamento,
        proximoPasso: rc.proximo_passo_ideal,
        risco: rc.risco_de_perda,
      }
    : null

  const result = await sendSlackSummary({
    closerName: call.closer?.name ?? 'Closer',
    clientName: call.client_name,
    callDate: call.call_date,
    overallScore: analysis.overall_score,
    summary: analysis.summary ?? '',
    strengths: feedback.strengths ?? [],
    improvements: feedback.fix_doing ?? feedback.weaknesses ?? [],
    actions,
    callUrl: appUrl(`/calls/${callId}`),
    commercial,
  })

  await db.from('slack_logs').insert({
    call_id: callId,
    channel: 'webhook',
    payload: result.payload,
    ok: result.ok,
    error: result.error,
  })

  return { ok: result.ok, error: result.error }
}

/** Action wrapper to (re)send the Slack summary. */
export async function resendSlackAction(formData: FormData) {
  const callId = String(formData.get('id'))
  await notifySlack(callId)
  revalidatePath(`/calls/${callId}`)
  revalidatePath('/settings/slack')
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
