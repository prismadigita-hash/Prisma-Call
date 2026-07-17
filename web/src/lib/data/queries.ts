import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type {
  Call,
  CallAnalysis,
  CallHighlight,
  CallWithCloser,
  Closer,
  Criterion,
  Feedback,
  FullAnalysis,
  ImprovementAction,
  Score,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Closers
// ---------------------------------------------------------------------------
export async function listClosers(): Promise<Closer[]> {
  const { data, error } = await supabaseAdmin()
    .from('closers')
    .select('*')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getCloser(id: string): Promise<Closer | null> {
  const { data, error } = await supabaseAdmin().from('closers').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Criteria
// ---------------------------------------------------------------------------
export async function listCriteria(): Promise<Criterion[]> {
  const { data, error } = await supabaseAdmin()
    .from('criteria')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------
export interface CallFilters {
  closerId?: string
  status?: string
  from?: string
  to?: string
  /** Máx. de linhas retornadas (proteção de performance nas listagens). */
  limit?: number
}

// Colunas usadas nas listagens — NUNCA buscar `transcript` aqui: é um texto
// gigante por linha e deixava /calls e o dashboard lentos.
const CALL_LIST_COLUMNS =
  'id, closer_id, client_name, call_date, source, recording_url, status, duration_sec, created_at, updated_at'

export async function listCalls(filters: CallFilters = {}): Promise<CallWithCloser[]> {
  let q = supabaseAdmin()
    .from('calls')
    .select(`${CALL_LIST_COLUMNS}, closer:closers(id, name, avatar_url), call_analyses(overall_score, status)`)
    .order('call_date', { ascending: false })
    .limit(filters.limit ?? 200)

  if (filters.closerId) q = q.eq('closer_id', filters.closerId)
  if (filters.status) q = q.eq('status', filters.status)
  if (filters.from) q = q.gte('call_date', filters.from)
  if (filters.to) q = q.lte('call_date', filters.to)

  const { data, error } = await q
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const analyses = (row.call_analyses as { overall_score: number | null; status: string }[]) ?? []
    const latest = analyses[0]
    const { call_analyses: _omit, ...call } = row
    void _omit
    return {
      ...(call as unknown as Call),
      transcript: null, // não carregado na listagem (ver CALL_LIST_COLUMNS)
      closer: row.closer as CallWithCloser['closer'],
      overall_score: latest?.overall_score ?? null,
    }
  })
}

export async function getCall(id: string): Promise<Call | null> {
  const { data, error } = await supabaseAdmin().from('calls').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getLatestAnalysis(callId: string): Promise<CallAnalysis | null> {
  const { data, error } = await supabaseAdmin()
    .from('call_analyses')
    .select('*')
    .eq('call_id', callId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Everything needed to render the analysis + feedback pages. */
export async function getFullAnalysis(callId: string): Promise<FullAnalysis | null> {
  const db = supabaseAdmin()
  const call = await getCall(callId)
  if (!call) return null

  const [closer, analysis] = await Promise.all([getCloser(call.closer_id), getLatestAnalysis(callId)])

  if (!analysis) {
    return { call, closer, analysis: null, scores: [], highlights: [], feedback: null, actions: [] }
  }

  const [scoresRes, highlightsRes, feedbackRes, actionsRes] = await Promise.all([
    db.from('scores').select('*').eq('analysis_id', analysis.id),
    db.from('call_highlights').select('*').eq('analysis_id', analysis.id),
    db.from('feedbacks').select('*').eq('analysis_id', analysis.id).maybeSingle(),
    db.from('improvement_actions').select('*').eq('analysis_id', analysis.id).order('priority'),
  ])

  return {
    call,
    closer,
    analysis,
    scores: (scoresRes.data as Score[]) ?? [],
    highlights: (highlightsRes.data as CallHighlight[]) ?? [],
    feedback: (feedbackRes.data as Feedback) ?? null,
    actions: (actionsRes.data as ImprovementAction[]) ?? [],
  }
}
