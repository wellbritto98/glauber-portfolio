import { cn } from '@/lib/utils'
import type { StoredImage } from '@/lib/schemas'

interface ImagemResponsivaProps {
  imagem: Pick<StoredImage, 'url' | 'thumbUrl' | 'width' | 'height' | 'alt'>
  /** Usa `thumbUrl` (versão 600px) quando disponível — para grades e cards. */
  usarThumb?: boolean
  /** Imagem acima da dobra: carrega logo e com prioridade alta. */
  prioridade?: boolean
  /** Preenche o container pai com recorte (`object-cover`), sem proporção própria. */
  preencher?: boolean
  className?: string
}

/**
 * `<img>` padrão do site público: sempre com `width`/`height` reais (o que
 * reserva o espaço via `aspect-ratio` e evita layout shift), `decoding`
 * assíncrono e, por padrão, carregamento preguiçoso.
 */
export function ImagemResponsiva({
  imagem,
  usarThumb = false,
  prioridade = false,
  preencher = false,
  className,
}: ImagemResponsivaProps) {
  const src = usarThumb ? (imagem.thumbUrl ?? imagem.url) : imagem.url

  return (
    <img
      src={src}
      alt={imagem.alt}
      width={imagem.width}
      height={imagem.height}
      loading={prioridade ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={prioridade ? 'high' : undefined}
      className={cn(
        'bg-surface',
        preencher ? 'h-full w-full object-cover' : 'h-auto w-full',
        className,
      )}
      style={preencher ? undefined : { aspectRatio: `${imagem.width} / ${imagem.height}` }}
    />
  )
}
