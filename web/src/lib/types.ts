// Domain types mirroring the database schema (see supabase/migrations).

export type CallStatus =
  | 'recebida'
  | 'pendente'
  | 'em_analise'
  | 'concluida'
  | 'revisada'
  | 'erro_na_analise'
export type AnalysisStatus = 'pendente' | 'em_analise' | 'concluida' | 'falhou'
export type ActionStatus = 'pendente' | 'em_andamento' | 'aplicada' | 'descartada'
export type CallSource = 'transcricao' | 'link' | 'audio' | 'video' | 'tactiq'

export interface Closer {
  id: string
  name: string
  email: string | null
  avatar_url: string | null
  role: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Criterion {
  id: string
  key: string
  label: string
  description: string | null
  weight: number
  sort_order: number
  active: boolean
  version: number
  created_at: string
}

export interface Call {
  id: string
  closer_id: string
  client_name: string
  call_date: string
  source: CallSource
  recording_url: string | null
  transcript: string | null
  status: CallStatus
  duration_sec: number | null
  created_at: string
  updated_at: string
}

export interface CallAnalysis {
  id: string
  call_id: string
  status: AnalysisStatus
  overall_score: number | null
  summary: string | null
  closer_talk_pct: number | null
  client_talk_pct: number | null
  model: string | null
  rubric_version: number
  raw: unknown
  error: string | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: string
  analysis_id: string
  criterion_key: string
  score: number
  justification: string | null
  created_at: string
}

export interface CallHighlight {
  id: string
  analysis_id: string
  kind: string
  timestamp_ref: string | null
  quote: string | null
  comment: string | null
  created_at: string
}

export interface Feedback {
  id: string
  analysis_id: string
  strengths: string[] | null
  weaknesses: string[] | null
  keep_doing: string[] | null
  fix_doing: string[] | null
  final_comment: string | null
  better_approach: string | null
  created_at: string
}

export interface ImprovementAction {
  id: string
  analysis_id: string
  closer_id: string
  title: string
  detail: string | null
  priority: number
  status: ActionStatus
  created_at: string
  updated_at: string
}

export type Nivel = 'baixo' | 'medio' | 'alto'
export type EtapaFunil =
  | 'anuncio'
  | 'lead'
  | 'whatsapp'
  | 'ligacao'
  | 'qualificacao'
  | 'reuniao'
  | 'proposta'
  | 'objecao'
  | 'follow_up'
  | 'decisao'

// Diagnóstico de causa raiz comercial (skill Prisma). Persistido dentro de
// call_analyses.raw.root_cause — não tem coluna própria.
export interface RootCause {
  diagnostico_direto: string
  sintoma: string
  causa_aparente: string
  causa_raiz: string
  causas_secundarias: string[]
  categorias_causa: string[]
  gravidade: Nivel
  confianca: Nivel
  etapa_quebrou: EtapaFunil
  o_que_deveria_ter_acontecido: string
  como_corrigir_agora: string
  como_prevenir: string
  mensagem_recomendada: string
  proximo_passo: string
}

export type MomentoCompra =
  | 'apenas_pesquisando'
  | 'comparando_preco'
  | 'pediu_orcamento'
  | 'demonstrou_interesse_real'
  | 'perto_do_fechamento'
  | 'pronto_para_fechar'
  | 'nao_identificado'
export type TemperaturaLead = 'frio' | 'morno' | 'quente' | 'muito_quente'

// Relatório comercial da oportunidade (skill comercial). Persistido em
// call_analyses.raw.relatorio_comercial — sem coluna própria.
export interface CommercialReport {
  contexto_do_cliente: string
  resumo_da_reuniao: string
  momento_de_compra: MomentoCompra
  temperatura_do_lead: TemperaturaLead
  probabilidade_estimada_de_fechamento: number
  probabilidade_justificativa: string
  sinais_de_compra: string[]
  objecoes_ou_travas: string[]
  proximo_passo_ideal: string
  risco_de_perda: Nivel
  risco_de_perda_motivo: string
  diagnostico_comercial_final: string
}

export interface SlackLog {
  id: string
  call_id: string | null
  channel: string | null
  payload: unknown
  ok: boolean
  error: string | null
  created_at: string
}

// Convenience composite used across pages.
export interface CallWithCloser extends Call {
  closer: Pick<Closer, 'id' | 'name' | 'avatar_url'> | null
  overall_score?: number | null
}

export interface FullAnalysis {
  call: Call
  closer: Closer | null
  analysis: CallAnalysis | null
  scores: Score[]
  highlights: CallHighlight[]
  feedback: Feedback | null
  actions: ImprovementAction[]
}
