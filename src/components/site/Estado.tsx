import { cn } from '@/lib/utils'

interface EstadoErroProps {
  titulo?: string
  mensagem?: string
  aoTentarNovamente: () => void
  className?: string
}

/** Estado de erro padrão de qualquer consulta do site: nunca tela branca. */
export function EstadoErro({
  titulo = 'Não foi possível carregar',
  mensagem = 'Algo deu errado ao buscar o conteúdo. Verifique sua conexão e tente novamente.',
  aoTentarNovamente,
  className,
}: EstadoErroProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-24 text-center', className)}>
      <p className="font-display text-xl font-semibold text-ink">{titulo}</p>
      <p className="max-w-sm font-body text-sm text-ink-muted">{mensagem}</p>
      <button
        type="button"
        onClick={aoTentarNovamente}
        className="mt-3 inline-flex h-11 items-center border border-rule px-6 font-body text-sm uppercase tracking-wider text-ink transition-colors hover:border-ink"
      >
        Tentar de novo
      </button>
    </div>
  )
}

/** Linha de texto em carregamento — para títulos, metadados etc. */
export function EsqueletoLinha({
  largura = 'w-1/2',
  altura = 'h-4',
  className,
}: {
  largura?: string
  altura?: string
  className?: string
}) {
  return <div className={cn('animate-pulse bg-surface', altura, largura, className)} />
}

/** Grade de retângulos em carregamento, respeitando a proporção usada nos cards. */
export function EsqueletoGrade({
  itens = 6,
  className,
}: {
  itens?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-20 lg:grid-cols-4',
        className,
      )}
    >
      {Array.from({ length: itens }).map((_, indice) => (
        <div key={indice} className={indice % 6 === 0 || indice % 6 === 3 ? 'sm:col-span-2' : ''}>
          <div className="animate-pulse bg-surface" style={{ aspectRatio: '4 / 5' }} />
          <div className="mt-3 h-3 w-2/3 animate-pulse bg-surface" />
        </div>
      ))}
    </div>
  )
}
