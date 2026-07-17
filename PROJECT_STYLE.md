# PROJECT_STYLE.md
# Design system deste projeto. Edite à vontade.
# Gerado em: 2026-07-17 (derivado do código existente + direção "futurista")

## Projeto
name: Call Intelligence (Prisma Call)
description: Análise de calls comerciais com IA — notas, feedback e evolução dos Closers.
tone: futurista, técnico, confiável — "cockpit" de gestão comercial

## Stack
framework: Next.js 16 (App Router, RSC, Server Actions)
typescript: sim
component_library: nenhuma (componentes próprios em src/components/ui.tsx)
icons: Lucide
animations: CSS puro (GPU-friendly: transform/opacity apenas — NUNCA filter: blur animado)

## Cores
primary: "#4f46e5"        # indigo-600
primary_hover: "#4338ca"  # indigo-700
background: "#f6f7fb"
surface: "#ffffff"
border: "#e7e9f0"
text_primary: "#0f172a"
text_secondary: "#64748b"
accent: "#38bdf8"         # sky-400 — brilhos/aurora
success: "#10b981"
error: "#ef4444"
warning: "#f59e0b"

## Dark Mode
dark_mode: both
dark_background: "#070b16"   # base do degradê (o fundo real é gradiente + aurora animada)
dark_surface: "#0e1626"
dark_border: "#1d2940"
dark_text_primary: "#e8eef9"
dark_text_secondary: "#93a1bd"

## Tipografia
font_heading: "Geist — Google Fonts (next/font)"
font_body: "Geist — Google Fonts (next/font)"
font_mono: "Geist Mono — Google Fonts (next/font)"

## Layout & Tokens
border_radius: modern   # botões rounded-xl, cards rounded-2xl, badges rounded-full
density: balanced       # cards p-5, listas gap-3/4, botões px-4 py-2

## Identidade visual "futurista" (regras próprias deste projeto)
# - Fundo: degradê azul-profundo + camada de aurora animada (radial-gradients,
#   animação só de transform/opacity, background-attachment: fixed, z-index -1).
#   Grid técnico sutil e ESTÁTICO por cima no dark (linhas 1px com máscara radial).
# - Cards no dark: superfície levemente translúcida sobre o fundo, borda fina,
#   glow indigo discreto no hover. SEM backdrop-blur (pesado — já foi removido antes).
# - Botão primário: gradiente indigo→violeta, glow, hover com leve lift
#   (-translate-y-0.5). Transições de 150ms.
# - Entrada de página: fade-up curto (0.3s) no conteúdo principal.
# - Skeletons de loading com shimmer (app/loading.tsx).
# - Acessibilidade: TODA animação decorativa respeita prefers-reduced-motion.

## Componentes Específicos do Domínio
# - ScoreBadge / ScoreBar: nota 0–10 com tom por faixa (>=8 emerald, >=6.5 lime,
#   >=5 amber, <5 rose) — ver scoreTone() em src/lib/utils.
# - StatusBadge: status da call (recebida/pendente/em_analise/concluida/revisada).
# - StatCard: KPI do dashboard (label + valor grande + TrendPill + ícone).
# - Radar/LineChart próprios em src/components/charts.tsx (SVG puro).
