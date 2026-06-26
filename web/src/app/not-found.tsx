import { ButtonLink } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-5xl font-bold text-slate-200">404</p>
      <p className="text-lg font-semibold text-slate-700">Página não encontrada</p>
      <p className="max-w-sm text-sm text-slate-500">O recurso que você procura não existe ou foi removido.</p>
      <ButtonLink href="/">Voltar ao dashboard</ButtonLink>
    </div>
  )
}
