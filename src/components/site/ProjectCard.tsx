import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useRevelar } from '@/hooks/useRevelar'
import { opcoesProjetosPublicados } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/schemas'
import { ImagemResponsiva } from './ImagemResponsiva'

interface ProjectCardProps {
  projeto: Project
  className?: string
  /** Primeiro card acima da dobra: carrega a capa com prioridade alta. */
  prioridade?: boolean
}

/**
 * Card de projeto usado na home e em `/projetos`.
 *
 * Sem sombra, sem cantos arredondados — só a imagem (na proporção real,
 * sem recorte) e um filete de metadados abaixo. No hover/foco, adianta a
 * consulta de projetos publicados para que a navegação pareça instantânea.
 */
export function ProjectCard({ projeto, className, prioridade = false }: ProjectCardProps) {
  const queryClient = useQueryClient()

  const adiantarConsulta = () => {
    void queryClient.prefetchQuery(opcoesProjetosPublicados)
  }

  const { ref, visivel } = useRevelar<HTMLDivElement>()

  return (
    <div ref={ref} data-visivel={visivel} className={cn('revelar', className)}>
      <Link
        to="/projetos/$slug"
        params={{ slug: projeto.slug }}
        onMouseEnter={adiantarConsulta}
        onFocus={adiantarConsulta}
        className="group block"
      >
        {projeto.coverImage ? (
          <ImagemResponsiva
            imagem={projeto.coverImage}
            usarThumb
            prioridade={prioridade}
            className="object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        ) : (
          <div className="aspect-[4/5] w-full bg-surface" />
        )}
        <div className={cn('mt-3 flex items-baseline justify-between gap-3')}>
          <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
            {projeto.title}
          </h3>
          <span className="shrink-0 font-body text-xs uppercase tracking-wider text-ink-faint">
            {projeto.year}
          </span>
        </div>
        {projeto.client && (
          <p className="mt-1 font-body text-xs uppercase tracking-wider text-ink-faint">
            {projeto.client}
          </p>
        )}
      </Link>
    </div>
  )
}
