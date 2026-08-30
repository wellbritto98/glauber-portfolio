import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { useProjects } from '@/hooks/useProjects'
import { useSections } from '@/hooks/useSections'
import { SiteLayout } from '@/components/site/SiteLayout'
import { ProjectCard } from '@/components/site/ProjectCard'
import { EstadoErro, EsqueletoGrade } from '@/components/site/Estado'
import { obterClasseSpan } from '@/components/site/gridSpan'
import { cn } from '@/lib/utils'

const buscaProjetosSchema = z.object({
  secao: z.string().optional(),
})

export const Route = createFileRoute('/projetos/')({
  component: ProjetosPage,
  validateSearch: buscaProjetosSchema,
})

function ProjetosPage() {
  const { secao } = Route.useSearch()
  const projetosConsulta = useProjects()
  const secoesConsulta = useSections()

  const secoes = secoesConsulta.data ?? []
  const secaoAtiva = secao ? secoes.find((item) => item.slug === secao) : undefined

  const projetos = projetosConsulta.data ?? []
  const projetosFiltrados = secao
    ? projetos.filter((projeto) => projeto.sectionId === secaoAtiva?.id)
    : projetos

  return (
    <SiteLayout>
      <title>{secaoAtiva ? `${secaoAtiva.name} — Projetos` : 'Projetos'}</title>
      <meta
        name="description"
        content={
          secaoAtiva
            ? `Projetos da seção ${secaoAtiva.name}.`
            : 'Todos os projetos publicados no portfólio.'
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Projetos
        </h1>

        {secoes.length > 0 && (
          <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2" aria-label="Filtrar por seção">
            <Link
              to="/projetos"
              search={{}}
              className={cn(
                'font-body text-sm uppercase tracking-wider transition-colors',
                secao ? 'text-ink-faint hover:text-ink' : 'text-ink',
              )}
            >
              Todos
            </Link>
            {secoes.map((item) => (
              <Link
                key={item.id}
                to="/projetos"
                search={{ secao: item.slug }}
                className={cn(
                  'font-body text-sm uppercase tracking-wider transition-colors',
                  secao === item.slug ? 'text-ink' : 'text-ink-faint hover:text-ink',
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-14">
          {projetosConsulta.isPending && <EsqueletoGrade />}

          {projetosConsulta.isError && (
            <EstadoErro
              mensagem={projetosConsulta.error?.message}
              aoTentarNovamente={() => projetosConsulta.refetch()}
            />
          )}

          {projetosConsulta.isSuccess && projetosFiltrados.length === 0 && (
            <p className="py-16 text-center font-body text-ink-muted">
              Nenhum projeto encontrado{secaoAtiva ? ` em ${secaoAtiva.name}` : ''}.
            </p>
          )}

          {projetosConsulta.isSuccess && projetosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-20 lg:grid-cols-4">
              {projetosFiltrados.map((projeto, indice) => (
                <ProjectCard
                  key={projeto.id}
                  projeto={projeto}
                  prioridade={indice === 0}
                  className={obterClasseSpan(indice)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}
