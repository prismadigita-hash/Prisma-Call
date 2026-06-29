import { z } from 'zod'
import { RUBRIC } from '@/lib/criteria'

const CRITERION_KEYS = RUBRIC.map((c) => c.key) as [string, ...string[]]
const HIGHLIGHT_KINDS = ['dor', 'objecao', 'virada', 'risco', 'momento'] as const
const NIVEIS = ['baixo', 'medio', 'alto'] as const
const MOMENTOS_COMPRA = [
  'apenas_pesquisando',
  'comparando_preco',
  'pediu_orcamento',
  'demonstrou_interesse_real',
  'perto_do_fechamento',
  'pronto_para_fechar',
  'nao_identificado',
] as const
const TEMPERATURAS = ['frio', 'morno', 'quente', 'muito_quente'] as const
const TIPOS_OBJECAO = ['prospeccao', 'red_herring', 'microcompromisso', 'compra'] as const
const QUALIDADES = ['boa', 'mediana', 'ruim'] as const
const ETAPAS = [
  'anuncio',
  'lead',
  'whatsapp',
  'ligacao',
  'qualificacao',
  'reuniao',
  'proposta',
  'objecao',
  'follow_up',
  'decisao',
] as const

// ---------------------------------------------------------------------------
// Zod schema — runtime validation of the AI output (provider-agnostic).
// ---------------------------------------------------------------------------
export const aiScoreSchema = z.object({
  criterion_key: z.enum(CRITERION_KEYS),
  score: z.number().min(0).max(10),
  justification: z.string(),
})

export const aiHighlightSchema = z.object({
  kind: z.enum(HIGHLIGHT_KINDS),
  timestamp_ref: z.string().nullable().optional(),
  quote: z.string(),
  comment: z.string(),
})

export const aiActionSchema = z.object({
  title: z.string(),
  detail: z.string(),
  priority: z.number().int().min(1).max(3),
})

export const aiRootCauseSchema = z.object({
  diagnostico_direto: z.string(),
  sintoma: z.string(),
  causa_aparente: z.string(),
  causa_raiz: z.string(),
  causas_secundarias: z.array(z.string()),
  categorias_causa: z.array(z.string()),
  gravidade: z.enum(NIVEIS),
  confianca: z.enum(NIVEIS),
  etapa_quebrou: z.enum(ETAPAS),
  o_que_deveria_ter_acontecido: z.string(),
  como_corrigir_agora: z.string(),
  como_prevenir: z.string(),
  mensagem_recomendada: z.string(),
  proximo_passo: z.string(),
})

export type AiRootCause = z.infer<typeof aiRootCauseSchema>

export const aiRelatorioComercialSchema = z.object({
  contexto_do_cliente: z.string(),
  resumo_da_reuniao: z.string(),
  momento_de_compra: z.enum(MOMENTOS_COMPRA),
  temperatura_do_lead: z.enum(TEMPERATURAS),
  probabilidade_estimada_de_fechamento: z.number().int().min(0).max(100),
  probabilidade_justificativa: z.string(),
  sinais_de_compra: z.array(z.string()),
  objecoes_ou_travas: z.array(z.string()),
  proximo_passo_ideal: z.string(),
  data_proximo_passo: z.string(),
  risco_de_perda: z.enum(NIVEIS),
  risco_de_perda_motivo: z.string(),
  diagnostico_comercial_final: z.string(),
})

export type AiRelatorioComercial = z.infer<typeof aiRelatorioComercialSchema>

export const aiObjecaoSchema = z.object({
  fala_do_lead: z.string(),
  tipo: z.enum(TIPOS_OBJECAO),
  resposta_do_vendedor: z.string(),
  qualidade: z.enum(QUALIDADES),
  problema: z.string(),
  resposta_ideal: z.string(),
})

export type AiObjecao = z.infer<typeof aiObjecaoSchema>

export const aiAnalysisSchema = z.object({
  summary: z.string(),
  overall_score: z.number().min(0).max(10),
  closer_talk_pct: z.number().int().min(0).max(100),
  client_talk_pct: z.number().int().min(0).max(100),
  scores: z.array(aiScoreSchema),
  highlights: z.array(aiHighlightSchema),
  feedback: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    keep_doing: z.array(z.string()),
    fix_doing: z.array(z.string()),
    final_comment: z.string(),
    better_approach: z.string(),
  }),
  actions: z.array(aiActionSchema),
  root_cause: aiRootCauseSchema,
  relatorio_comercial: aiRelatorioComercialSchema,
  objecoes: z.array(aiObjecaoSchema),
})

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>

// ---------------------------------------------------------------------------
// Gemini responseSchema — passed to the Gemini API for structured JSON output.
// Gemini uses OpenAPI-style schema with UPPERCASE types and does NOT support
// `additionalProperties`. `propertyOrdering` keeps the model's output stable.
// ---------------------------------------------------------------------------
export const aiAnalysisGeminiSchema = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: 'Resumo geral da call em 3-5 frases.' },
    overall_score: { type: 'NUMBER', description: 'Nota geral de 0 a 10.' },
    closer_talk_pct: { type: 'INTEGER', description: '% de tempo de fala do Closer (0-100).' },
    client_talk_pct: { type: 'INTEGER', description: '% de tempo de fala do cliente (0-100).' },
    scores: {
      type: 'ARRAY',
      description: 'Uma nota para CADA critério da rubrica.',
      items: {
        type: 'OBJECT',
        properties: {
          criterion_key: { type: 'STRING', enum: CRITERION_KEYS },
          score: { type: 'NUMBER', description: 'Nota de 0 a 10 para este critério.' },
          justification: { type: 'STRING', description: 'Justificativa objetiva citando a call.' },
        },
        required: ['criterion_key', 'score', 'justification'],
        propertyOrdering: ['criterion_key', 'score', 'justification'],
      },
    },
    highlights: {
      type: 'ARRAY',
      description: 'Momentos importantes: dores, objeções, viradas, riscos.',
      items: {
        type: 'OBJECT',
        properties: {
          kind: { type: 'STRING', enum: [...HIGHLIGHT_KINDS] },
          timestamp_ref: { type: 'STRING', nullable: true, description: 'Marca de tempo se houver (ex: "12:30").' },
          quote: { type: 'STRING' },
          comment: { type: 'STRING' },
        },
        required: ['kind', 'quote', 'comment'],
        propertyOrdering: ['kind', 'timestamp_ref', 'quote', 'comment'],
      },
    },
    feedback: {
      type: 'OBJECT',
      properties: {
        strengths: { type: 'ARRAY', items: { type: 'STRING' } },
        weaknesses: { type: 'ARRAY', items: { type: 'STRING' } },
        keep_doing: { type: 'ARRAY', items: { type: 'STRING' } },
        fix_doing: { type: 'ARRAY', items: { type: 'STRING' } },
        final_comment: { type: 'STRING', description: 'Comentário final humano, direto e construtivo.' },
        better_approach: {
          type: 'STRING',
          description: 'Como conduzir melhor, com exemplos concretos do que dizer (reescreva falas).',
        },
      },
      required: ['strengths', 'weaknesses', 'keep_doing', 'fix_doing', 'final_comment', 'better_approach'],
      propertyOrdering: ['strengths', 'weaknesses', 'keep_doing', 'fix_doing', 'final_comment', 'better_approach'],
    },
    actions: {
      type: 'ARRAY',
      description: 'Ações práticas e específicas de melhoria.',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          detail: { type: 'STRING' },
          priority: { type: 'INTEGER', description: '1 alta, 2 média, 3 baixa.' },
        },
        required: ['title', 'detail', 'priority'],
        propertyOrdering: ['title', 'detail', 'priority'],
      },
    },
    root_cause: {
      type: 'OBJECT',
      description: 'Diagnóstico de causa raiz comercial (skill Prisma).',
      properties: {
        diagnostico_direto: { type: 'STRING', description: 'Causa principal mais provável, em poucas linhas.' },
        sintoma: { type: 'STRING', description: 'O que apareceu na superfície.' },
        causa_aparente: { type: 'STRING', description: 'O motivo óbvio aparente.' },
        causa_raiz: { type: 'STRING', description: 'O fator profundo por trás do problema.' },
        causas_secundarias: { type: 'ARRAY', items: { type: 'STRING' } },
        categorias_causa: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Categorias envolvidas.' },
        gravidade: { type: 'STRING', enum: [...NIVEIS] },
        confianca: { type: 'STRING', enum: [...NIVEIS] },
        etapa_quebrou: { type: 'STRING', enum: [...ETAPAS] },
        o_que_deveria_ter_acontecido: { type: 'STRING' },
        como_corrigir_agora: { type: 'STRING' },
        como_prevenir: { type: 'STRING' },
        mensagem_recomendada: { type: 'STRING', description: 'Mensagem/fala pronta no tom firme (vazia se não fizer sentido).' },
        proximo_passo: { type: 'STRING' },
      },
      required: [
        'diagnostico_direto',
        'sintoma',
        'causa_aparente',
        'causa_raiz',
        'causas_secundarias',
        'categorias_causa',
        'gravidade',
        'confianca',
        'etapa_quebrou',
        'o_que_deveria_ter_acontecido',
        'como_corrigir_agora',
        'como_prevenir',
        'mensagem_recomendada',
        'proximo_passo',
      ],
      propertyOrdering: [
        'diagnostico_direto',
        'sintoma',
        'causa_aparente',
        'causa_raiz',
        'causas_secundarias',
        'categorias_causa',
        'gravidade',
        'confianca',
        'etapa_quebrou',
        'o_que_deveria_ter_acontecido',
        'como_corrigir_agora',
        'como_prevenir',
        'mensagem_recomendada',
        'proximo_passo',
      ],
    },
    relatorio_comercial: {
      type: 'OBJECT',
      description: 'Relatório comercial da oportunidade (lado do cliente e chance de venda).',
      properties: {
        contexto_do_cliente: { type: 'STRING', description: 'Quem é o cliente e o que buscava. "não identificado na conversa" se não houver.' },
        resumo_da_reuniao: { type: 'STRING', description: 'Resumo comercial curto: o que aconteceu, interesse, o que foi tratado e como terminou.' },
        momento_de_compra: { type: 'STRING', enum: [...MOMENTOS_COMPRA] },
        temperatura_do_lead: { type: 'STRING', enum: [...TEMPERATURAS] },
        probabilidade_estimada_de_fechamento: { type: 'INTEGER', description: 'Estimativa 0-100 baseada só nos sinais da conversa.' },
        probabilidade_justificativa: { type: 'STRING', description: 'Por que essa porcentagem.' },
        sinais_de_compra: { type: 'ARRAY', items: { type: 'STRING' } },
        objecoes_ou_travas: { type: 'ARRAY', items: { type: 'STRING' } },
        proximo_passo_ideal: { type: 'STRING' },
        data_proximo_passo: {
          type: 'STRING',
          description:
            'Quando o próximo passo/reunião foi MARCADO na call, conforme a transcrição (ex.: "terça às 15h", "amanhã 10h", "15/07"). Se nada foi agendado, retorne exatamente "não identificado na conversa".',
        },
        risco_de_perda: { type: 'STRING', enum: [...NIVEIS] },
        risco_de_perda_motivo: { type: 'STRING' },
        diagnostico_comercial_final: { type: 'STRING', description: 'Diagnóstico direto de gestor comercial sobre a oportunidade.' },
      },
      required: [
        'contexto_do_cliente',
        'resumo_da_reuniao',
        'momento_de_compra',
        'temperatura_do_lead',
        'probabilidade_estimada_de_fechamento',
        'probabilidade_justificativa',
        'sinais_de_compra',
        'objecoes_ou_travas',
        'proximo_passo_ideal',
        'data_proximo_passo',
        'risco_de_perda',
        'risco_de_perda_motivo',
        'diagnostico_comercial_final',
      ],
      propertyOrdering: [
        'contexto_do_cliente',
        'resumo_da_reuniao',
        'momento_de_compra',
        'temperatura_do_lead',
        'probabilidade_estimada_de_fechamento',
        'probabilidade_justificativa',
        'sinais_de_compra',
        'objecoes_ou_travas',
        'proximo_passo_ideal',
        'data_proximo_passo',
        'risco_de_perda',
        'risco_de_perda_motivo',
        'diagnostico_comercial_final',
      ],
    },
    objecoes: {
      type: 'ARRAY',
      description: 'Mapa de objeções da call. Lista vazia se não houver objeções.',
      items: {
        type: 'OBJECT',
        properties: {
          fala_do_lead: { type: 'STRING' },
          tipo: { type: 'STRING', enum: [...TIPOS_OBJECAO] },
          resposta_do_vendedor: { type: 'STRING' },
          qualidade: { type: 'STRING', enum: [...QUALIDADES] },
          problema: { type: 'STRING' },
          resposta_ideal: { type: 'STRING' },
        },
        required: ['fala_do_lead', 'tipo', 'resposta_do_vendedor', 'qualidade', 'problema', 'resposta_ideal'],
        propertyOrdering: ['fala_do_lead', 'tipo', 'resposta_do_vendedor', 'qualidade', 'problema', 'resposta_ideal'],
      },
    },
  },
  required: [
    'summary',
    'overall_score',
    'closer_talk_pct',
    'client_talk_pct',
    'scores',
    'highlights',
    'feedback',
    'actions',
    'root_cause',
    'relatorio_comercial',
    'objecoes',
  ],
  propertyOrdering: [
    'summary',
    'overall_score',
    'closer_talk_pct',
    'client_talk_pct',
    'scores',
    'highlights',
    'feedback',
    'actions',
    'root_cause',
    'relatorio_comercial',
    'objecoes',
  ],
} as const
