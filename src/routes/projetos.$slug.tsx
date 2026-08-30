import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useProject } from '@/hooks/useProject'
import { SiteLayout } from '@/components/site/SiteLayout'
import { ImagemResponsiva } from '@/components/site/ImagemResponsiva'
import { Lightbox } from '@/components/site/Lightbox'
import { EstadoErro, EsqueletoLinha } from '@/components/site/Estado'

export const Route = createFileRoute('/projetos/$slug')({
  component: ProjetoPage,
})

function ProjetoPage() {
  const { slug } = Route.useParams()
  const { data, isPending, isError, error, refetch } = useProject(slug)
  const [indiceLightbox, setIndiceLightbox] = useState<number | null>(null)

  if (isPending) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <EsqueletoLinha largura="w-1/4" altura="h-3" />
          <EsqueletoLinha largura="w-2/3" altura="h-12" className="mt-4" />
          <div className="mt-10 animate-pulse bg-surface sm:mt-16" style={{ aspectRatio: '16 / 10' }} />
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
  const metadados = [projeto.client, projeto.year, projeto.role].filter(Boolean)
  const galeria = [...projeto.gallery].sort((a, b) => a.order - b.order)
  const descricaoResumida = projeto.description.replace(/\s+/g, ' ').trim().slice(0, 160)

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
          <h1 className="text-balance font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
            {projeto.title}
          </h1>
          {metadados.length > 0 && (
            <p className="mt-4 font-body text-xs uppercase tracking-wider text-ink-faint">
              {metadados.join(' · ')}
            </p>
          )}
        </header>

        {projeto.coverImage && (
          <div className="mx-auto mt-10 max-w-6xl px-6 sm:mt-16">
            <div className="aspect-[16/10] overflow-hidden bg-surface">
              <ImagemResponsiva imagem={projeto.coverImage} prioridade preencher />
            </div>
          </div>
        )}

        {projeto.description && (
          <div className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
            <p className="whitespace-pre-line font-body text-lg leading-relaxed text-ink-muted">
              {projeto.description}
            </p>
          </div>
        )}

        {galeria.length > 0 && (
          <div className="mx-auto max-w-6xl px-6 pb-24">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {galeria.map((imagem, indice) => (
                <button
                  key={imagem.path}
                  type="button"
                  onClick={() => setIndiceLightbox(indice)}
                  className="group block w-full text-left"
                  aria-label={`Ampliar imagem: ${imagem.alt || projeto.title}`}
                >
                  <ImagemResponsiva
                    imagem={imagem}
                    className="object-cover transition-opacity duration-300 group-hover:opacity-90"
                  />
                  {imagem.caption && (
                    <p className="mt-2 font-body text-xs text-ink-faint">{imagem.caption}</p>
                  )}
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
