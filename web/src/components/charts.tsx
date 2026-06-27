import { fmtScore } from '@/lib/utils'

// ---------------------------------------------------------------------------
// LineChart — evolution of overall score over time (0..10)
// ---------------------------------------------------------------------------
export function LineChart({
  points,
  height = 220,
}: {
  points: { label: string; value: number }[]
  height?: number
}) {
  const W = 640
  const H = height
  const pad = { top: 16, right: 16, bottom: 28, left: 32 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  if (points.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-400">Sem dados suficientes.</div>
  }

  const xFor = (i: number) =>
    pad.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const yFor = (v: number) => pad.top + innerH - (Math.max(0, Math.min(10, v)) / 10) * innerH

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.value)}`).join(' ')
  const areaPath =
    `${linePath} L ${xFor(points.length - 1)} ${pad.top + innerH} L ${xFor(0)} ${pad.top + innerH} Z`

  const gridYs = [0, 2.5, 5, 7.5, 10]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolução das notas">
      <defs>
        <linearGradient id="lc-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridYs.map((g) => (
        <g key={g}>
          <line x1={pad.left} x2={W - pad.right} y1={yFor(g)} y2={yFor(g)} stroke="#eef0f5" strokeWidth={1} />
          <text x={8} y={yFor(g) + 4} fontSize={10} fill="#94a3b8">
            {g}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#lc-area)" />
      <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xFor(i)} cy={yFor(p.value)} r={4} fill="#fff" stroke="#4f46e5" strokeWidth={2} />
          {(points.length <= 10 || i === 0 || i === points.length - 1) && (
            <text x={xFor(i)} y={H - 10} fontSize={10} fill="#94a3b8" textAnchor="middle">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// RadarChart — score per criterion (0..10)
// ---------------------------------------------------------------------------
export function RadarChart({ data }: { data: { label: string; value: number | null }[] }) {
  const size = 300 // chart area (square)
  const padX = 64 // horizontal room for labels so they don't clip
  const c = size / 2
  const radius = size / 2 - 42
  const n = data.length

  if (n < 3) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-400">Sem dados suficientes.</div>
  }

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pointFor = (i: number, value: number) => {
    const r = (Math.max(0, Math.min(10, value)) / 10) * radius
    return [c + r * Math.cos(angleFor(i)), c + r * Math.sin(angleFor(i))]
  }

  const rings = [2.5, 5, 7.5, 10]
  const polygon = data
    .map((d, i) => pointFor(i, d.value ?? 0))
    .map(([x, y]) => `${x},${y}`)
    .join(' ')

  return (
    <svg
      viewBox={`${-padX} 0 ${size + padX * 2} ${size}`}
      className="mx-auto w-full max-w-[420px]"
      role="img"
      aria-label="Radar de critérios"
    >
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={data
            .map((_, i) => pointFor(i, ring))
            .map(([x, y]) => `${x},${y}`)
            .join(' ')}
          fill="none"
          stroke="#eef0f5"
          strokeWidth={1}
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = pointFor(i, 10)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#eef0f5" strokeWidth={1} />
      })}

      <polygon points={polygon} fill="#6366f1" fillOpacity={0.18} stroke="#4f46e5" strokeWidth={2} />

      {data.map((d, i) => {
        const [x, y] = pointFor(i, d.value ?? 0)
        return <circle key={i} cx={x} cy={y} r={3} fill="#4f46e5" />
      })}

      {data.map((d, i) => {
        const [lx, ly] = pointFor(i, 11.6)
        const anchor = Math.abs(lx - c) < 14 ? 'middle' : lx > c ? 'start' : 'end'
        return (
          <text key={i} x={lx} y={ly} fontSize={10} fill="#64748b" textAnchor={anchor} dominantBaseline="middle">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// BarList — horizontal score bars for criteria
// ---------------------------------------------------------------------------
export function BarList({ items }: { items: { label: string; value: number | null }[] }) {
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const v = it.value ?? 0
        const pct = Math.max(0, Math.min(100, (v / 10) * 100))
        const fill = v >= 8 ? 'bg-emerald-500' : v >= 6.5 ? 'bg-lime-500' : v >= 5 ? 'bg-amber-500' : 'bg-rose-500'
        return (
          <div key={it.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{it.label}</span>
                <span className="text-xs font-semibold tabular-nums text-slate-500">{fmtScore(it.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
