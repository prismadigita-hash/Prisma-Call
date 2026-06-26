import { supabaseAdmin } from '@/lib/supabase/admin'
import { runAnalysis } from '@/lib/actions/analysis'
import { isAIEnabled } from '@/lib/ai/config'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/webhooks/tactiq
// Recebe uma call transcrita pelo Tactiq (via Zapier/Make ou webhook direto),
// salva no Supabase, dispara a análise com Gemini e notifica o Slack.
//
// Segurança opcional: se TACTIQ_WEBHOOK_SECRET estiver definido, o request
// precisa enviar o header `x-webhook-secret` (ou ?secret=) com o mesmo valor.
// ---------------------------------------------------------------------------

interface TactiqPayload {
  titulo_da_call?: string
  data_da_call?: string
  closer?: string
  cliente?: string
  empresa?: string
  link_da_reuniao?: string
  transcricao?: string
  participantes?: string | string[]
  origem?: string
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

function toDateOnly(value?: string): string {
  if (value) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

/** Find a closer by name (case-insensitive) or create it. Always returns an id. */
async function resolveCloserId(name?: string): Promise<string> {
  const db = supabaseAdmin()
  const clean = (name ?? '').trim()
  const target = clean || 'Não informado'

  const { data: found } = await db.from('closers').select('id').ilike('name', target).limit(1).maybeSingle()
  if (found?.id) return found.id

  const { data: created, error } = await db.from('closers').insert({ name: target }).select('id').single()
  if (error || !created) throw new Error('Não foi possível resolver o Closer: ' + (error?.message ?? ''))
  return created.id
}

export async function POST(request: Request) {
  const db = supabaseAdmin()

  // 1) Autenticação opcional por segredo compartilhado
  const secret = process.env.TACTIQ_WEBHOOK_SECRET
  if (secret) {
    const url = new URL(request.url)
    const provided = request.headers.get('x-webhook-secret') ?? url.searchParams.get('secret')
    if (provided !== secret) {
      return json({ ok: false, error: 'Não autorizado: segredo do webhook inválido.' }, 401)
    }
  }

  // 2) Parse do corpo
  let payload: TactiqPayload
  try {
    payload = (await request.json()) as TactiqPayload
  } catch {
    return json({ ok: false, error: 'Corpo inválido: envie um JSON válido.' }, 400)
  }

  // 3) Validar transcrição
  const transcricao = (payload.transcricao ?? '').trim()
  if (!transcricao || transcricao.length < 40) {
    return json(
      {
        ok: false,
        error:
          'Transcrição ausente ou muito curta. Envie o campo "transcricao" com o texto da call (mín. 40 caracteres).',
      },
      400,
    )
  }

  // 4) Montar dados da call
  const participantesStr = Array.isArray(payload.participantes)
    ? payload.participantes.join(', ')
    : (payload.participantes ?? '').toString().trim()

  const clientName =
    [payload.cliente, payload.empresa].map((s) => (s ?? '').trim()).filter(Boolean).join(' — ') ||
    payload.titulo_da_call?.trim() ||
    'Cliente não informado'

  // Cabeçalho de contexto para enriquecer a análise da IA
  const header: string[] = []
  if (payload.titulo_da_call) header.push(`Título: ${payload.titulo_da_call.trim()}`)
  if (payload.empresa) header.push(`Empresa: ${payload.empresa.trim()}`)
  if (participantesStr) header.push(`Participantes: ${participantesStr}`)
  const fullTranscript = (header.length ? header.join('\n') + '\n\n' : '') + transcricao

  let callId: string | null = null
  try {
    const closerId = await resolveCloserId(payload.closer)

    const { data: call, error: insErr } = await db
      .from('calls')
      .insert({
        closer_id: closerId,
        client_name: clientName,
        call_date: toDateOnly(payload.data_da_call),
        source: 'tactiq',
        recording_url: (payload.link_da_reuniao ?? '').trim() || null,
        transcript: fullTranscript,
        status: 'recebida',
      })
      .select('id')
      .single()

    if (insErr || !call) throw new Error('Falha ao salvar a call: ' + (insErr?.message ?? ''))
    callId = call.id

    await db.from('webhook_logs').insert({
      source: 'tactiq',
      call_id: callId,
      ok: true,
      status: 'recebida',
      payload: payload as unknown,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido ao salvar a call.'
    await db.from('webhook_logs').insert({ source: 'tactiq', ok: false, status: 'erro_ao_salvar', error: message, payload: payload as unknown })
    return json({ ok: false, error: message }, 500)
  }

  if (!callId) return json({ ok: false, error: 'Falha inesperada ao salvar a call.' }, 500)

  // 5) Modo manual: sem Gemini, mantém a call salva como "recebida"
  if (!isAIEnabled()) {
    return json({
      ok: true,
      call_id: callId,
      status: 'recebida',
      message: 'Call recebida e salva. IA desativada (GEMINI_API_KEY vazia): análise não disparada.',
    })
  }

  // 6) Disparar análise (persiste resultado + Slack acontecem dentro de runAnalysis)
  const result = await runAnalysis(callId)

  if (!result.ok) {
    // 7) Falha na análise: manter call salva com status "erro_na_analise" + log
    await db.from('calls').update({ status: 'erro_na_analise' }).eq('id', callId)
    await db.from('webhook_logs').insert({
      source: 'tactiq',
      call_id: callId,
      ok: false,
      status: 'erro_na_analise',
      error: result.error ?? 'Falha na análise.',
    })
    return json({
      ok: false,
      call_id: callId,
      status: 'erro_na_analise',
      error: result.error ?? 'Falha na análise com Gemini. A call foi salva.',
    })
  }

  return json({
    ok: true,
    call_id: callId,
    status: 'concluida',
    message: 'Call recebida, analisada e registrada com sucesso.',
  })
}

// GET de cortesia para teste manual no navegador (não processa nada).
export async function GET() {
  return json({
    ok: true,
    service: 'tactiq-webhook',
    method: 'Use POST com JSON contendo o campo "transcricao".',
  })
}
