import 'server-only'
import { fmtScore } from '@/lib/utils'

export interface SlackCommercial {
  temperatura: string
  probabilidade: number
  proximoPasso: string
  risco: string
}

export interface SlackSummaryInput {
  closerName: string
  clientName: string
  callDate: string
  overallScore: number | null
  summary: string
  strengths: string[]
  improvements: string[]
  actions: string[]
  callUrl: string
  commercial?: SlackCommercial | null
}

const TEMP_EMOJI: Record<string, string> = {
  frio: '🧊 Frio',
  morno: '🌤️ Morno',
  quente: '🔥 Quente',
  muito_quente: '🔥🔥 Muito quente',
}
const RISCO_LABEL: Record<string, string> = { baixo: '🟢 Baixo', medio: '🟡 Médio', alto: '🔴 Alto' }

/** Build a Slack Block Kit payload for a call summary. */
export function buildSlackBlocks(input: SlackSummaryInput) {
  const bullets = (items: string[], limit = 3) =>
    items.slice(0, limit).map((i) => `• ${i}`).join('\n') || '—'

  const scoreEmoji =
    input.overallScore == null ? '⚪' : input.overallScore >= 8 ? '🟢' : input.overallScore >= 6 ? '🟡' : '🔴'

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📞 Análise de Call — ${input.closerName}`, emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Cliente:*\n${input.clientName}` },
        { type: 'mrkdwn', text: `*Data:*\n${input.callDate}` },
        { type: 'mrkdwn', text: `*Nota geral:*\n${scoreEmoji} *${fmtScore(input.overallScore)}* / 10` },
        { type: 'mrkdwn', text: `*Closer:*\n${input.closerName}` },
      ],
    },
    { type: 'section', text: { type: 'mrkdwn', text: `*Resumo:*\n${input.summary}` } },
  ]

  // Bloco comercial da oportunidade
  if (input.commercial) {
    const c = input.commercial
    blocks.push({ type: 'divider' })
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*🌡️ Temperatura:*\n${TEMP_EMOJI[c.temperatura] ?? c.temperatura}` },
        { type: 'mrkdwn', text: `*📈 Prob. fechamento:*\n*${c.probabilidade}%*` },
        { type: 'mrkdwn', text: `*⚠️ Risco de perda:*\n${RISCO_LABEL[c.risco] ?? c.risco}` },
        { type: 'mrkdwn', text: `*➡️ Próximo passo:*\n${c.proximoPasso}` },
      ],
    })
  }

  blocks.push(
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: `*✅ Pontos positivos*\n${bullets(input.strengths)}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*⚠️ Pontos de melhoria*\n${bullets(input.improvements)}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*🎯 Ações recomendadas*\n${bullets(input.actions)}` } },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Ver análise completa', emoji: true },
          url: input.callUrl,
          style: 'primary',
        },
      ],
    },
  )

  return {
    text: `Análise de call — ${input.closerName} (${fmtScore(input.overallScore)})`,
    blocks,
  }
}

export interface SlackSendResult {
  ok: boolean
  error: string | null
  payload: unknown
}

/** Send a summary to the configured Slack Incoming Webhook. */
export async function sendSlackSummary(input: SlackSummaryInput): Promise<SlackSendResult> {
  const webhook = process.env.SLACK_WEBHOOK_URL
  const payload = buildSlackBlocks(input)

  if (!webhook) {
    return { ok: false, error: 'SLACK_WEBHOOK_URL não configurada.', payload }
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: `Slack respondeu ${res.status}: ${body}`, payload }
    }
    return { ok: true, error: null, payload }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido', payload }
  }
}
