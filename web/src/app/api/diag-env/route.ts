export const dynamic = 'force-dynamic'

// Diagnóstico seguro: mostra QUAIS variáveis de ambiente o container enxerga em
// runtime — apenas presença e tamanho, NUNCA o valor. Remover depois de depurar.
export async function GET() {
  const keys = [
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'APP_URL',
    'NEXT_PUBLIC_APP_URL',
    'TACTIQ_WEBHOOK_SECRET',
    'PORT',
    'HOSTNAME',
    'NODE_ENV',
  ]
  const out: Record<string, string> = {}
  for (const k of keys) {
    const v = process.env[k]
    out[k] = v ? `OK (len ${v.length})` : 'AUSENTE'
  }
  return Response.json(out)
}
