// The evaluation rubric, mirrored here for use by the AI prompt and as a UI
// fallback. The source of truth at runtime is the `criteria` table; this list
// keeps the prompt self-contained and lets the UI render labels without a DB
// round-trip. Keep in sync with supabase/migrations/0002_seed_criteria.sql.

export const RUBRIC_VERSION = 1

export interface RubricCriterion {
  key: string
  label: string
  short: string
  description: string
  weight: number
}

export const RUBRIC: RubricCriterion[] = [
  { key: 'clareza_comunicacao', label: 'Clareza na comunicação', short: 'Clareza', weight: 1.0, description: 'Fala objetiva, sem ruído, fácil de entender; ritmo e linguagem adequados ao cliente.' },
  { key: 'dominio_processo', label: 'Domínio do processo comercial', short: 'Domínio', weight: 1.2, description: 'Conduz as etapas da venda com método; sabe onde está e para onde vai.' },
  { key: 'diagnostico', label: 'Diagnóstico do cliente', short: 'Diagnóstico', weight: 1.5, description: 'Entende o contexto, cenário e necessidade real antes de oferecer solução.' },
  { key: 'perguntas', label: 'Capacidade de fazer perguntas', short: 'Perguntas', weight: 1.2, description: 'Faz perguntas abertas e relevantes que aprofundam o entendimento.' },
  { key: 'identificacao_dores', label: 'Identificação de dores', short: 'Dores', weight: 1.5, description: 'Encontra e qualifica as dores e o impacto/custo delas para o cliente.' },
  { key: 'conducao', label: 'Condução da conversa', short: 'Condução', weight: 1.3, description: 'Mantém o controle e o direcionamento da call sem ser atropelado.' },
  { key: 'quebra_objecoes', label: 'Quebra de objeções', short: 'Objeções', weight: 1.4, description: 'Lida com objeções com segurança, validando e reposicionando valor.' },
  { key: 'apresentacao_solucao', label: 'Apresentação da solução', short: 'Solução', weight: 1.3, description: 'Conecta a solução às dores levantadas, de forma personalizada.' },
  { key: 'criacao_valor', label: 'Criação de valor', short: 'Valor', weight: 1.3, description: 'Constrói percepção de valor acima do preço; foca em resultado.' },
  { key: 'proximos_passos', label: 'Próximos passos', short: 'Próx. passos', weight: 1.1, description: 'Define claramente o que acontece a seguir, com data e compromisso.' },
  { key: 'fechamento', label: 'Fechamento / tentativa de avanço', short: 'Fechamento', weight: 1.4, description: 'Pede o avanço/fechamento na hora certa; não deixa a call morrer.' },
  { key: 'postura', label: 'Postura profissional', short: 'Postura', weight: 1.0, description: 'Confiança, escuta ativa, tom consultivo e presença.' },
]

export const RUBRIC_BY_KEY: Record<string, RubricCriterion> = Object.fromEntries(
  RUBRIC.map((c) => [c.key, c]),
)

export function labelFor(key: string): string {
  return RUBRIC_BY_KEY[key]?.label ?? key
}

export function shortLabelFor(key: string): string {
  return RUBRIC_BY_KEY[key]?.short ?? RUBRIC_BY_KEY[key]?.label ?? key
}

/** Weighted average of a set of {criterion_key, score} into a 0..10 overall. */
export function weightedOverall(scores: { criterion_key: string; score: number }[]): number | null {
  if (!scores.length) return null
  let sum = 0
  let wsum = 0
  for (const s of scores) {
    const w = RUBRIC_BY_KEY[s.criterion_key]?.weight ?? 1
    sum += Number(s.score) * w
    wsum += w
  }
  if (wsum === 0) return null
  return Math.round((sum / wsum) * 10) / 10
}
