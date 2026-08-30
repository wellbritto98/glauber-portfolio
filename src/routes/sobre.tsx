import { createFileRoute } from '@tanstack/react-router'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { SiteLayout } from '@/components/site/SiteLayout'
import { EstadoErro, EsqueletoLinha } from '@/components/site/Estado'

export const Route = createFileRoute('/sobre')({
  component: SobrePage,
})

function SobrePage() {
  const { data, isPending, isError, error, refetch } = useSiteSettings()

  return (
    <SiteLayout>
      <title>{data?.ownerName ? `Sobre — ${data.ownerName}` : 'Sobre'}</title>
      <meta
        name="description"
        content={data?.bio ? data.bio.replace(/\s+/g, ' ').trim().slice(0, 160) : 'Sobre o designer.'}
      />

      {isPending && (
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
            <div className="h-40 w-40 shrink-0 animate-pulse rounded-full bg-surface sm:h-48 sm:w-48" />
            <div className="flex-1 space-y-4">
              <EsqueletoLinha largura="w-1/3" altura="h-10" />
              <EsqueletoLinha largura="w-full" altura="h-4" />
              <EsqueletoLinha largura="w-5/6" altura="h-4" />
            </div>
          </div>
        </div>
      )}

      {isError && <EstadoErro mensagem={error?.message} aoTentarNovamente={() => refetch()} />}

      {data && (
        <article className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start">
            {data.profileImage && (
              <img
                src={data.profileImage.url}
                alt={data.ownerName ? `Retrato de ${data.ownerName}` : 'Retrato'}
                loading="lazy"
                decoding="async"
                className="h-40 w-40 shrink-0 rounded-lg bg-surface object-cover sm:h-48 sm:w-48"
              />
            )}
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Sobre
              </h1>
              {data.bio && (
                <p className="mt-6 whitespace-pre-line font-body text-lg leading-relaxed text-ink-muted">
                  {data.bio}
                </p>
              )}
            </div>
          </div>

          {(data.email || data.phone || data.location || data.resumeUrl) && (
            <dl className="mt-16 grid grid-cols-1 gap-8 border-t border-rule pt-10 sm:grid-cols-2">
              {data.email && (
                <div>
                  <dt className="font-body text-xs uppercase tracking-wider text-ink-faint">E-mail</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${data.email}`}
                      className="font-body text-ink transition-colors hover:text-brand"
                    >
                      {data.email}
                    </a>
                  </dd>
                </div>
              )}
              {data.phone && (
                <div>
                  <dt className="font-body text-xs uppercase tracking-wider text-ink-faint">Telefone</dt>
                  <dd className="mt-1 font-body text-ink">{data.phone}</dd>
                </div>
              )}
              {data.location && (
                <div>
                  <dt className="font-body text-xs uppercase tracking-wider text-ink-faint">
                    Localização
                  </dt>
                  <dd className="mt-1 font-body text-ink">{data.location}</dd>
                </div>
              )}
              {data.resumeUrl && (
                <div>
                  <dt className="font-body text-xs uppercase tracking-wider text-ink-faint">Currículo</dt>
                  <dd className="mt-1">
                    <a
                      href={data.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-body text-ink transition-colors hover:text-brand"
                    >
                      Baixar currículo
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          )}

          {data.socials.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-10">
              {data.socials.map((rede) => (
                <a
                  key={rede.platform}
                  href={rede.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-sm uppercase tracking-wider text-ink-faint transition-colors hover:text-brand"
                >
                  {rede.platform}
                </a>
              ))}
            </div>
          )}
        </article>
      )}
    </SiteLayout>
  )
}
