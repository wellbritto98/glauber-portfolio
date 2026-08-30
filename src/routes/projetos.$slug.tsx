import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { useSections } from '@/hooks/useSections'
import { SiteLayout } from '@/components/site/SiteLayout'
import { ImagemResponsiva } from '@/components/site/ImagemResponsiva'
import { Lightbox } from '@/components/site/Lightbox'
import { EstadoErro, EsqueletoLinha } from '@/components/site/Estado'
import { obterClasseSpan } from '@/components/site/gridSpan'
import { cn } from '@/lib/utils'
import type { Project, Section } from '@/lib/schemas'

export const Route = createFileRoute('/projetos/$slug')({
  component: ProjetoPage,
})

function ProjetoPage() {
  const { slug } = Route.useParams()
  const { data, isPending, isError, error, refetch } = useProject(slug)
  // A seção é dado secundário: se a consulta falhar ou a seção estiver oculta,
  // a página continua inteira, só sem o nome da seção.
  const { data: secoes } = useSections()
  const [indiceLightbox, setIndiceLightbox] = useState<number | null>(null)

  if (isPending) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <EsqueletoLinha largura="w-1/4" altura="h-3" />
          <EsqueletoLinha largura="w-2/3" altura="h-12" className="mt-4" />
          <div className="mt-10 animate-pulse bg-surface sm:mt-16" style={{ aspectRatio: '3 / 2' }} />
        </div>
      </SiteLayout>
    )
  }

  if (isError) {
    return (
      <SiteLayout>
        <EstadoErro mensagem={error?.message} aoTentarNovamente={() => refetch()} />
      </SiteLayout>
    )
  }

  if (!data || !data.projeto) {
    return (
      <SiteLayout>
        <title>Projeto não encontrado</title>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <p className="font-display text-3xl font-semibold text-ink">Projeto não encontrado</p>
          <p className="mt-3 font-body text-ink-muted">
            Este projeto pode ter sido removido ou o endereço está incorreto.
          </p>
          <Link
            to="/projetos"
            className="mt-8 inline-flex h-11 items-center border-b border-ink font-body text-sm uppercase tracking-wider text-ink transition-colors hover:border-brand hover:text-brand"
          >
            Ver todos os projetos
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const { projeto, anterior, proximo } = data
  const secao = secoes?.find((item) => item.id === projeto.sectionId)
  const galeria = [...projeto.gallery].sort((a, b) => a.order - b.order)
  const descricaoResumida = projeto.description.replace(/\s+/g, ' ').trim().slice(0, 160)
  const temDescricao = projeto.description.trim().length > 0

  return (
    <SiteLayout>
      <title>{`${projeto.title} — Portfólio`}</title>
      <meta name="description" content={descricaoResumida || projeto.title} />
      <meta property="og:title" content={projeto.title} />
      <meta property="og:description" content={descricaoResumida || projeto.title} />
      {projeto.coverImage && <meta property="og:image" content={projeto.coverImage.url} />}
      <meta property="og:type" content="article" />

      <article>
        <header className="mx-auto max-w-6xl px-6 pt-16 sm:pt-24">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-2.5">
            <Link
              to="/projetos"
              search={{}}
              className="font-body text-xs uppercase tracking-wider text-ink-faint transition-colors hover:text-ink"
            >
              Projetos
            </Link>
            {secao && (
              <>
                <ChevronRight size={14} className="text-ink-faint" aria-hidden="true" />
                <Link
                  to="/projetos"
                  search={{ secao: secao.slug }}
                  className="font-body text-xs uppercase tracking-wider text-brand transition-colors hover:text-ink"
                >
                  {secao.name}
                </Link>
              </>
            )}
          </nav>

          <h1 className="mt-7 text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
            {projeto.title}
          </h1>

          <div
            className={cn(
              'mt-12 border-t border-rule pt-10',
              temDescricao && 'lg:grid lg:grid-cols-3 lg:gap-16',
            )}
          >
            {temDescricao && (
              <p className="whitespace-pre-line font-body text-lg leading-relaxed text-ink-muted lg:col-span-2 lg:text-xl">
                {projeto.description}
              </p>
            )}
            <FichaTecnica
              projeto={projeto}
              secao={secao}
              emGrade={!temDescricao}
              className={cn(temDescricao && 'mt-10 lg:mt-0')}
            />
          </div>
        </header>

        {projeto.coverImage && (
          <div className="mx-auto mt-14 max-w-6xl px-6 sm:mt-20">
            <ImagemResponsiva imagem={projeto.coverImage} prioridade />
          </div>
        )}

        {galeria.length > 0 && (
          <div className="mx-auto mt-16 max-w-6xl px-6 pb-24 sm:mt-20">
            <div className="flex items-baseline justify-between border-b border-rule pb-3.5">
              <h2 className="font-body text-xs uppercase tracking-wider text-ink-faint">Galeria</h2>
              <span className="font-body text-xs uppercase tracking-wider text-ink-faint">
                {galeria.length.toString().padStart(2, '0')}{' '}
                {galeria.length === 1 ? 'peça' : 'peças'}
              </span>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14">
              {galeria.map((imagem, indice) => (
                <button
                  key={imagem.path}
                  type="button"
                  onClick={() => setIndiceLightbox(indice)}
                  className={cn('group block w-full text-left', obterClasseSpan(indice))}
                  aria-label={`Ampliar imagem: ${imagem.alt || projeto.title}`}
                >
                  <ImagemResponsiva
                    imagem={imagem}
                    className="transition-opacity duration-300 group-hover:opacity-90"
                  />
                  <div className="mt-2.5 flex items-baseline justify-between gap-4">
                    {imagem.caption && (
                      <p className="font-body text-xs text-ink-faint">{imagem.caption}</p>
                    )}
                    <span className="ml-auto shrink-0 font-body text-xs uppercase tracking-wider text-ink-faint">
                      {(indice + 1).toString().padStart(2, '0')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {(anterior || proximo) && (
          <nav className="border-t border-rule" aria-label="Navegação entre projetos">
            <div className="mx-auto grid max-w-6xl grid-cols-1 sm:grid-cols-2">
              {anterior ? (
                <Link
                  to="/projetos/$slug"
                  params={{ slug: anterior.slug }}
                  className="border-b border-rule px-6 py-10 transition-colors hover:text-brand sm:border-b-0 sm:border-r sm:py-16"
                >
                  <span className="font-body text-xs uppercase tracking-wider text-ink-faint">
                    Anterior
                  </span>
                  <p className="mt-2 font-display text-xl font-semibold tracking-tight">
                    {anterior.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
              {proximo ? (
                <Link
                  to="/projetos/$slug"
                  params={{ slug: proximo.slug }}
                  className="px-6 py-10 text-right transition-colors hover:text-brand sm:py-16"
                >
                  <span className="font-body text-xs uppercase tracking-wider text-ink-faint">
                    Próximo
                  </span>
                  <p className="mt-2 font-display text-xl font-semibold tracking-tight">
                    {proximo.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </nav>
        )}
      </article>

      <Lightbox
        imagens={galeria}
        indice={indiceLightbox}
        onFechar={() => setIndiceLightbox(null)}
        onNavegar={setIndiceLightbox}
      />
    </SiteLayout>
  )
}

/**
 * Ficha técnica do projeto: cliente, ano, papel, seção e tags.
 *
 * Linha sem valor não é renderizada. `client` e `role` têm `default('')` no
 * schema, e um rótulo sem valor ao lado só ocupa espaço.
 */
function FichaTecnica({
  projeto,
  secao,
  emGrade,
  className,
}: {
  projeto: Project
  secao: Section | undefined
  /** Sem descrição ao lado, a ficha ocupa a largura toda em quatro colunas. */
  emGrade: boolean
  className?: string
}) {
  const linhas = [
    { rotulo: 'Cliente', valor: projeto.client },
    { rotulo: 'Ano', valor: projeto.year },
    { rotulo: 'Papel', valor: projeto.role },
  ].filter((linha) => linha.valor)

  const classeLinha = cn(
    'border-b border-rule py-3.5',
    !emGrade && 'flex items-baseline justify-between gap-4',
  )
  const classeRotulo = 'font-body text-xs uppercase tracking-wider text-ink-faint'
  const classeValor = cn('font-body text-sm text-ink', emGrade ? 'mt-1.5' : 'text-right')

  return (
    <div className={className}>
      <dl
        className={cn(
          'border-t border-rule',
          emGrade && 'grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {linhas.map((linha) => (
          <div key={linha.rotulo} className={classeLinha}>
            <dt className={classeRotulo}>{linha.rotulo}</dt>
            <dd className={classeValor}>{linha.valor}</dd>
          </div>
        ))}
        {secao && (
          <div className={classeLinha}>
            <dt className={classeRotulo}>Seção</dt>
            <dd className={classeValor}>
              <Link
                to="/projetos"
                search={{ secao: secao.slug }}
                className="text-brand transition-colors hover:text-ink"
              >
                {secao.name}
              </Link>
            </dd>
          </div>
        )}
      </dl>

      {projeto.tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {projeto.tags.map((tag) => (
            <li
              key={tag}
              className="border border-rule px-2.5 py-1.5 font-body text-xs uppercase tracking-wider text-ink-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
