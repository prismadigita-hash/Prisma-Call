import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { RUBRIC } from '@/lib/criteria'

// Shape returned by the analyses+scores join used across metrics.
interface AnalysisRow {
  id: string
  overall_score: number | null
  call: { closer_id: string; call_date: string } | null
  scores: { criterion_key: string; score: number }[]
}

async function fetchConcludedAnalyses(closerId?: string): Promise<AnalysisRow[]> {
  let q = supabaseAdmin()
    .from('call_analyses')
    .select('id, overall_score, call:calls!inner(closer_id, call_date), scores(criterion_key, score)')
    .eq('status', 'concluida')

  if (closerId) q = q.eq('call.closer_id', closerId)

  const { data, error } = await q
  if (error) throw error
  // Order by date ascending in JS (nested column ordering is awkward in PostgREST).
  const rows = (data as unknown as AnalysisRow[]) ?? []
  return rows.sort((a, b) => (a.call?.call_date ?? '').localeCompare(b.call?.call_date ?? ''))
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round((nums.reduce((s, n) => s + Number(n), 0) / nums.length) * 10) / 10
}

/** % change of the last `window` analyses vs the previous `window`. */
function evolutionPct(series: number[], window = 3): number | null {
  if (series.length < 2) return null
  const recent = series.slice(-window)
  const prev = series.slice(-2 * window, -window)
  const rAvg = avg(recent)
  const pAvg = avg(prev.length ? prev : series.slice(0, -window))
  if (rAvg == null || pAvg == null || pAvg === 0) return null
  return Math.round(((rAvg - pAvg) / pAvg) * 1000) / 10
}

export interface CloserMetricRow {
  closerId: string
  callsAnalyzed: number
  avgOverall: number | null
  evolutionPct: number | null
  lastScore: number | null
}

export interface DashboardMetrics {
  totalClosers: number
  totalCallsAnalyzed: number
  teamAvg: number | null
  teamEvolutionPct: number | null
  byCloser: Record<string, CloserMetricRow>
  criteriaAverages: { key: string; label: string; avg: number | null }[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const rows = await fetchConcludedAnalyses()

  const overallSeries = rows.map((r) => Number(r.overall_score)).filter((n) => !Number.isNaN(n))

  // Per-closer aggregation
  const byCloser: Record<string, CloserMetricRow> = {}
  const closerSeries: Record<string, number[]> = {}
  const closerSet = new Set<string>()

  for (const r of rows) {
    const cid = r.call?.closer_id
    if (!cid) continue
    closerSet.add(cid)
    const s = Number(r.overall_score)
    if (!Number.isNaN(s)) (closerSeries[cid] ??= []).push(s)
  }

  for (const cid of closerSet) {
    const series = closerSeries[cid] ?? []
    byCloser[cid] = {
      closerId: cid,
      callsAnalyzed: series.length,
      avgOverall: avg(series),
      evolutionPct: evolutionPct(series),
      lastScore: series.length ? series[series.length - 1] : null,
    }
  }

  // Criteria averages across the whole team
  const criteriaBuckets: Record<string, number[]> = {}
  for (const r of rows) {
    for (const s of r.scores ?? []) {
      ;(criteriaBuckets[s.criterion_key] ??= []).push(Number(s.score))
    }
  }
  const criteriaAverages = RUBRIC.map((c) => ({
    key: c.key,
    label: c.label,
    avg: avg(criteriaBuckets[c.key] ?? []),
  }))

  return {
    totalClosers: closerSet.size,
    totalCallsAnalyzed: rows.length,
    teamAvg: avg(overallSeries),
    teamEvolutionPct: evolutionPct(overallSeries),
    byCloser,
    criteriaAverages,
  }
}

export interface CloserEvolution {
  callsAnalyzed: number
  avgOverall: number | null
  evolutionPct: number | null
  timeline: { date: string; score: number }[]
  criteriaAverages: { key: string; label: string; avg: number | null }[]
  recentVsPrevious: { criterion_key: string; label: string; recent: number | null; previous: number | null }[]
  strengths: { key: string; label: string; avg: number }[]
  weaknesses: { key: string; label: string; avg: number }[]
}

export async function getCloserEvolution(closerId: string): Promise<CloserEvolution> {
  const rows = await fetchConcludedAnalyses(closerId)

  const timeline = rows
    .filter((r) => r.overall_score != null && r.call)
    .map((r) => ({ date: r.call!.call_date, score: Number(r.overall_score) }))

  const overallSeries = timeline.map((t) => t.score)

  // Criterion buckets, split into first vs second half by chronology
  const criteriaBuckets: Record<string, number[]> = {}
  const half = Math.floor(rows.length / 2)
  const prevBuckets: Record<string, number[]> = {}
  const recentBuckets: Record<string, number[]> = {}

  rows.forEach((r, idx) => {
    for (const s of r.scores ?? []) {
      ;(criteriaBuckets[s.criterion_key] ??= []).push(Number(s.score))
      if (rows.length > 1) {
        if (idx < half) (prevBuckets[s.criterion_key] ??= []).push(Number(s.score))
        else (recentBuckets[s.criterion_key] ??= []).push(Number(s.score))
      }
    }
  })

  const criteriaAverages = RUBRIC.map((c) => ({
    key: c.key,
    label: c.label,
    avg: avg(criteriaBuckets[c.key] ?? []),
  }))

  const recentVsPrevious = RUBRIC.map((c) => ({
    criterion_key: c.key,
    label: c.label,
    recent: avg(recentBuckets[c.key] ?? []),
    previous: avg(prevBuckets[c.key] ?? []),
  }))

  const ranked = criteriaAverages
    .filter((c) => c.avg != null)
    .sort((a, b) => (b.avg as number) - (a.avg as number))

  const strengths = ranked.slice(0, 3).map((c) => ({ key: c.key, label: c.label, avg: c.avg as number }))
  const weaknesses = ranked
    .slice(-3)
    .reverse()
    .map((c) => ({ key: c.key, label: c.label, avg: c.avg as number }))

  return {
    callsAnalyzed: rows.length,
    avgOverall: avg(overallSeries),
    evolutionPct: evolutionPct(overallSeries),
    timeline,
    criteriaAverages,
    recentVsPrevious,
    strengths,
    weaknesses,
  }
}

/** Count of improvement actions applied for a closer ("feedbacks aplicados"). */
export async function countAppliedActions(closerId: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from('improvement_actions')
    .select('id', { count: 'exact', head: true })
    .eq('closer_id', closerId)
    .eq('status', 'aplicada')
  if (error) throw error
  return count ?? 0
}
