// Skeleton global: aparece instantaneamente enquanto o servidor busca os dados
// da página — a navegação "responde" na hora em vez de parecer travada.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando…">
      <div className="mb-6">
        <div className="skeleton h-8 w-56" />
        <div className="skeleton mt-2 h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton mt-3 h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="skeleton mb-4 h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton h-9 w-9 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton mt-1.5 h-3 w-1/4" />
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
