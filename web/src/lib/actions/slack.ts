'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendSlackSummary } from '@/lib/slack/notify'

/** Send a test summary to the configured Slack webhook and log it. */
export async function sendTestSlack() {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const result = await sendSlackSummary({
    closerName: 'Closer de Teste',
    clientName: 'Cliente Exemplo',
    callDate: new Date().toISOString().slice(0, 10),
    overallScore: 8.2,
    summary: 'Mensagem de teste da integração com o Slack. Se você está vendo isso, a configuração funcionou. ✅',
    strengths: ['Boa condução da conversa', 'Diagnóstico bem feito'],
    improvements: ['Tentar o fechamento mais cedo'],
    actions: ['Revisar script de quebra de objeções'],
    callUrl: base,
  })

  try {
    await supabaseAdmin().from('slack_logs').insert({
      channel: 'webhook (teste)',
      payload: result.payload,
      ok: result.ok,
      error: result.error,
    })
  } catch {
    // logging is best-effort; ignore if DB not ready
  }

  revalidatePath('/settings/slack')
}
