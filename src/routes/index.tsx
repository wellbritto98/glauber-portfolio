import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import { useSections } from '@/hooks/useSections'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { SiteLayout } from '@/components/site/SiteLayout'
import { ProjectCard } from '@/components/site/ProjectCard'
import { EstadoErro, EsqueletoGrade, EsqueletoLinha } from '@/components/site/Estado'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <SiteLayout>
      <title>Portfólio</title>
      <meta name="description" content="Portfólio de design gráfico: projetos, processo e contato." />

      <SecaoHero />
      <SecaoDestaques />
      <SecaoSecoes />
    </SiteLayout>
  )
}

function SecaoHero() {
  const { data, isPending, isError, error, refetch } = useSiteSettings()

  if (isPending) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-28 sm:py-36">
        <EsqueletoLinha largura="w-1/4" altura="h-3" />
        <EsqueletoLinha largura="w-4/5" altura="h-14" className="mt-6" />
      </div>
    )
  }

  if (isError) {
    return <EstadoErro mensagem={error?.message} aoTentarNovamente={() => refetch()} />
  }

  return (
    <div className="surgir mx-auto max-w-4xl px-6 py-28 sm:py-36">
      {data.ownerName && (
        <p className="font-body text-xs uppercase tracking-wider text-ink-faint">{data.ownerName}</p>
      )}
      <h1 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl">
        {data.headline || 'Design que comunica com precisão.'}
      </h1>
      <Link
        to="/projetos"
        className="mt-10 inline-flex h-11 items-center gap-2 border-b border-ink font-body text-sm uppercase tracking-wider text-ink transition-colors hover:border-brand hover:text-brand"
      >
        Ver projetos
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  )
}

function SecaoDestaques() {
  const { data, isPending, isError, error, refetch } = useProjects()

  if (isPending) {
    return (
      <section className="border-t border-rule px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <EsqueletoGrade itens={2} />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="border-t border-rule">
        <EstadoErro mensagem={error?.message} aoTentarNovamente={() => refetch()} />
      </section>
    )
  }

  const destaques = data.filter((projeto) => projeto.featured)
  if (destaques.length === 0) return null

  return (
    <section className="border-t border-rule px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-body text-xs uppercase tracking-wider text-ink-faint">Em destaque</h2>
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2">
          {destaques.map((projeto, indice) => (
            <ProjectCard key={projeto.id} projeto={projeto} prioridade={indice === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}

function SecaoSecoes() {
  const { data, isPending, isError, error, refetch } = useSections()

  if (isPending) {
    return (
      <section className="border-t border-rule px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl space-y-4">
          <EsqueletoLinha largura="w-1/4" altura="h-3" />
          <EsqueletoLinha largura="w-full" altura="h-12" />
          <EsqueletoLinha largura="w-full" altura="h-12" />
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="border-t border-rule">
        <EstadoErro mensagem={error?.message} aoTentarNovamente={() => refetch()} />
      </section>
    )
  }

  if (data.length === 0) return null

  return (
    <section className="border-t border-rule px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-body text-xs uppercase tracking-wider text-ink-faint">Explorar por seção</h2>
        <ul className="mt-8 border-t border-rule">
          {data.map((secao) => (
            <li key={secao.id} className="border-b border-rule">
              <Link
                to="/projetos"
                search={{ secao: secao.slug }}
                className="group flex items-center justify-between py-5 font-display text-2xl font-semibold tracking-tight text-ink transition-colors hover:text-brand sm:text-3xl"
              >
                {secao.name}
                <ArrowUpRight
                  size={22}
                  className="shrink-0 text-ink-faint transition-colors group-hover:text-brand"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
