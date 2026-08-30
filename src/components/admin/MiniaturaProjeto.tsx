import { ImageOff } from 'lucide-react'
import type { Project } from '@/lib/schemas'

/** Miniatura da capa do projeto, com placeholder quando não houver imagem. */
export function MiniaturaProjeto({ projeto }: { projeto: Project }) {
  const imagem = projeto.coverImage

  if (!imagem) {
    return (
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageOff className="size-4" />
      </div>
    )
  }

  return (
    <img
      src={imagem.thumbUrl ?? imagem.url}
      alt={imagem.alt || projeto.title}
      width={40}
      height={40}
      loading="lazy"
      className="size-10 shrink-0 rounded-md bg-muted object-cover"
    />
  )
}
