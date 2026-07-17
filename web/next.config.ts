import type { NextConfig } from 'next'

// CSP em modo Report-Only: REPORTA violações mas NUNCA bloqueia — adiciona
// visibilidade de segurança sem risco de quebrar a UI. Quando o app estiver
// estável, troque "Content-Security-Policy-Report-Only" por
// "Content-Security-Policy" para passar a aplicar de fato.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next/Turbopack precisam de inline e eval (sobretudo em dev/HMR)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `connect-src 'self' https: wss: ${supabaseUrl}`.trim(),
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
]

const nextConfig: NextConfig = {
  // Build self-contained (.next/standalone) — ideal para Docker/EasyPanel.
  output: 'standalone',
  // Não revelar a tecnologia do servidor
  poweredByHeader: false,
  experimental: {
    // Navegação instantânea: reusa a página no cliente por até 30s (o
    // AutoRefresh continua atualizando os dados por trás).
    staleTimes: { dynamic: 30, static: 180 },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
