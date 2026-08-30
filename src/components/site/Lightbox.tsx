import { useCallback, useEffect } from 'react'
import { Dialog, VisuallyHidden } from 'radix-ui'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryImage } from '@/lib/schemas'

interface LightboxProps {
  imagens: GalleryImage[]
  /** `null` fechado; caso contrário, índice da imagem exibida em `imagens`. */
  indice: number | null
  onFechar: () => void
  onNavegar: (indice: number) => void
}

/**
 * Lightbox da galeria do projeto, com Radix cru (sem estilos do shadcn).
 * Navegação por seta esquerda/direita além dos botões, Esc fecha (padrão
 * do Radix Dialog).
 */
export function Lightbox({ imagens, indice, onFechar, onNavegar }: LightboxProps) {
  const aberto = indice !== null
  const imagemAtual = indice !== null ? imagens[indice] : null

  const irParaAnterior = useCallback(() => {
    if (indice === null || imagens.length === 0) return
    onNavegar((indice - 1 + imagens.length) % imagens.length)
  }, [indice, imagens.length, onNavegar])

  const irParaProxima = useCallback(() => {
    if (indice === null || imagens.length === 0) return
    onNavegar((indice + 1) % imagens.length)
  }, [indice, imagens.length, onNavegar])

  useEffect(() => {
    if (!aberto) return
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'ArrowLeft') irParaAnterior()
      if (evento.key === 'ArrowRight') irParaProxima()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto, irParaAnterior, irParaProxima])

  return (
    <Dialog.Root open={aberto} onOpenChange={(valor) => !valor && onFechar()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/90" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-10"
          onOpenAutoFocus={(evento) => evento.preventDefault()}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>{imagemAtual?.alt || 'Imagem ampliada'}</Dialog.Title>
          </VisuallyHidden.Root>

          {imagemAtual && (
            <figure className="flex max-h-full max-w-full flex-col items-center gap-3">
              <img
                src={imagemAtual.url}
                alt={imagemAtual.alt}
                width={imagemAtual.width}
                height={imagemAtual.height}
                loading="lazy"
                decoding="async"
                className="max-h-[80vh] max-w-full object-contain sm:max-h-[85vh]"
              />
              {imagemAtual.caption && (
                <figcaption className="max-w-lg text-center font-body text-sm text-paper/80">
                  {imagemAtual.caption}
                </figcaption>
              )}
            </figure>
          )}

          <Dialog.Close
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-paper/80 transition-colors hover:text-paper sm:right-6 sm:top-6"
          >
            <X size={26} aria-hidden="true" />
          </Dialog.Close>

          {imagens.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Imagem anterior"
                onClick={irParaAnterior}
                className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-paper/80 transition-colors hover:text-paper sm:left-4"
              >
                <ChevronLeft size={32} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Próxima imagem"
                onClick={irParaProxima}
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-paper/80 transition-colors hover:text-paper sm:right-4"
              >
                <ChevronRight size={32} aria-hidden="true" />
              </button>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
