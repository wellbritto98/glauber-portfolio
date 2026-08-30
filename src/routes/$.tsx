import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteLayout } from '@/components/site/SiteLayout'

export const Route = createFileRoute('/$')({
  component: NaoEncontrado,
})

function NaoEncontrado() {
  return (
    <SiteLayout>
      <title>Página não encontrada</title>
      <meta name="description" content="A página que você procura não existe." />

      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
        <p className="font-display text-8xl font-extrabold tracking-tight text-ink-faint">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Página não encontrada</h1>
        <p className="mt-3 font-body text-ink-muted">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center border-b border-ink font-body text-sm uppercase tracking-wider text-ink transition-colors hover:border-brand hover:text-brand"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </SiteLayout>
  )
}
