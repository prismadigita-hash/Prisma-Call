// AI provider configuration (Google Gemini).
//
// Uses a free/light model by default (Gemini Flash) to keep cost minimal.
// When GEMINI_API_KEY is not set, the system runs in "manual mode" — the AI
// analysis step is cleanly disabled and the rest of the app keeps working.

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

/** True when a Gemini API key is configured (AI features enabled). */
export function isAIEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY)
}

export const AI_DISABLED_MESSAGE =
  'IA desativada (modo manual). Defina GEMINI_API_KEY em .env.local para habilitar a análise automática.'
