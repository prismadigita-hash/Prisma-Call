import 'server-only'
import { aiAnalysisGeminiSchema, aiAnalysisSchema, type AiAnalysis } from './schema'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt'
import { GEMINI_MODEL } from './config'

export interface AnalyzeInput {
  closerName: string
  clientName: string
  callDate: string
  transcript: string
}

export interface AnalyzeResult {
  data: AiAnalysis
  model: string
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Transient errors worth retrying: 429 (rate limit) and 503 (overloaded).
const RETRYABLE = new Set([429, 503])
const MAX_ATTEMPTS = 4

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Run the AI analysis on a call transcript using the Google Gemini API
 * (Flash model — free/light tier) and return validated structured data.
 * Throws a descriptive error if Gemini is not configured or the output is invalid.
 */
export async function analyzeCall(input: AnalyzeInput): Promise<AnalyzeResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada — sistema em modo manual (sem IA).')
  }
  if (!input.transcript || input.transcript.trim().length < 40) {
    throw new Error('Transcrição muito curta ou ausente para análise.')
  }

  const model = GEMINI_MODEL
  const url = `${GEMINI_BASE}/${model}:generateContent`

  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
    generationConfig: {
      // Consistência (mesma call -> mesma nota): temperatura 0 + seed fixo +
      // "thinking" desligado (o raciocínio interno do 2.5-flash é a maior fonte
      // de variação). Também deixa a análise mais rápida.
      temperature: 0,
      topP: 0.1,
      seed: 7,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
      responseSchema: aiAnalysisGeminiSchema,
    },
  })

  // Retry transient errors (429/503) with exponential backoff: ~2s, 5s, 9s.
  let res: Response | null = null
  let lastErrorBody = ''
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: requestBody,
    })
    if (res.ok) break

    lastErrorBody = await res.text()
    if (RETRYABLE.has(res.status) && attempt < MAX_ATTEMPTS) {
      await sleep(attempt * 2500)
      continue
    }
    const hint =
      res.status === 503
        ? ' (modelo sobrecarregado — tente novamente em instantes)'
        : res.status === 429
          ? ' (limite de cota — aguarde ~1 min)'
          : ''
    throw new Error(`Gemini respondeu ${res.status}${hint}: ${lastErrorBody.slice(0, 400)}`)
  }

  if (!res || !res.ok) {
    throw new Error('Gemini indisponível após várias tentativas. Tente novamente em instantes.')
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
    promptFeedback?: { blockReason?: string }
  }

  if (json.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueou o conteúdo: ${json.promptFeedback.blockReason}`)
  }

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  if (!text.trim()) {
    throw new Error('A IA (Gemini) não retornou conteúdo.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('A IA (Gemini) retornou um JSON inválido.')
  }

  const result = aiAnalysisSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error('A resposta da IA não bateu com o schema esperado: ' + result.error.message)
  }

  return { data: result.data, model }
}
