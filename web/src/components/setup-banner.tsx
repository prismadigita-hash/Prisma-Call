import { AlertTriangle } from 'lucide-react'
import { Card, CardBody } from '@/components/ui'

/** Shown when a DB query fails (tables missing / service_role not set). */
export function SetupBanner({ error }: { error?: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardBody className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={20} />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">Banco de dados ainda não configurado</p>
          <p className="mt-1 text-amber-800">
            Rode as migrations em <code className="rounded bg-amber-100 px-1">supabase/migrations</code> no SQL Editor
            do seu projeto Supabase e preencha <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
            em <code className="rounded bg-amber-100 px-1">.env.local</code>. Veja o{' '}
            <code className="rounded bg-amber-100 px-1">README.md</code>.
          </p>
          {error && <p className="mt-2 font-mono text-xs text-amber-700">{error}</p>}
        </div>
      </CardBody>
    </Card>
  )
}
