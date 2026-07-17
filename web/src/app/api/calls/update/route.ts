import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServerSupabase } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// POST /api/calls/update — atualiza Closer/cliente/data de uma call.
//
// Por que uma rota de API em vez de Server Action: Server Actions quebram em
// abas abertas antes de um deploy (IDs mudam a cada build) — o clique falha em
// silêncio. Uma rota de API com fetch funciona independente da versão da aba.
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Sessão obrigatória (o proxy já bloqueia, mas validamos de novo aqui).
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.auth.getUser()
    if (!data?.user) return Response.json({ ok: false, error: 'Não autenticado.' }, { status: 401 })
  } catch {
    return Response.json({ ok: false, error: 'Falha ao validar a sessão.' }, { status: 401 })
  }

  let body: { id?: string; closer_id?: string; client_name?: string; call_date?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, error: 'JSON inválido.' }, { status: 400 })
  }

  const id = (body.id ?? '').trim()
  if (!id) return Response.json({ ok: false, error: 'id da call é obrigatório.' }, { status: 400 })

  const closer_id = (body.closer_id ?? '').trim() || null
  const client_name = (body.client_name ?? '').trim()
  const call_date = (body.call_date ?? '').trim()

  const patch: Record<string, string> = {}
  if (closer_id) patch.closer_id = closer_id
  if (client_name) patch.client_name = client_name
  if (call_date) patch.call_date = call_date
  if (Object.keys(patch).length === 0) return Response.json({ ok: true, message: 'Nada para salvar.' })

  const db = supabaseAdmin()
  const [updRes, analysesRes] = await Promise.all([
    db.from('calls').update(patch).eq('id', id).select('id').single(),
    closer_id ? db.from('call_analyses').select('id').eq('call_id', id) : Promise.resolve({ data: null }),
  ])
  if (updRes.error) {
    return Response.json({ ok: false, error: updRes.error.message }, { status: 500 })
  }

  // Reatribui as ações de melhoria ao novo Closer (métricas de evolução)
  if (closer_id) {
    const ids = (analysesRes.data ?? []).map((a: { id: string }) => a.id)
    if (ids.length) {
      await db.from('improvement_actions').update({ closer_id }).in('analysis_id', ids)
    }
  }

  revalidatePath(`/calls/${id}`)
  revalidatePath('/calls')
  revalidatePath('/')
  if (closer_id) revalidatePath(`/closers/${closer_id}`)

  return Response.json({ ok: true })
}
