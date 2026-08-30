import { ImageOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ProjectInput } from '@/lib/schemas'

export interface PreviewProjetoDialogProps {
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  valores: ProjectInput
  nomeDaSecao?: string
}

/**
 * Pré-visualização do conteúdo antes de publicar. Não reproduz o site
 * público pixel a pixel — o objetivo é o designer conferir o conteúdo.
 */
export function PreviewProjetoDialog({
  aberto,
  onOpenChange,
  valores,
  nomeDaSecao,
}: PreviewProjetoDialogProps) {
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pré-visualização</DialogTitle>
          <DialogDescription>Como o projeto vai aparecer no site.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {valores.coverImage ? (
              <img
                src={valores.coverImage.url}
                alt={valores.coverImage.alt || valores.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="size-8" />
                <p className="text-sm">Sem imagem de capa</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <h2 className="font-heading text-xl font-semibold">
              {valores.title || 'Sem título'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {[nomeDaSecao, valores.year, valores.client].filter(Boolean).join(' · ') ||
                'Sem seção, ano ou cliente definidos'}
            </p>
            {valores.role && <p className="text-sm text-muted-foreground">Papel: {valores.role}</p>}
          </div>

          {valores.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {valores.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {valores.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{valores.description}</p>
          )}

          {valores.gallery.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Galeria</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[...valores.gallery]
                  .sort((a, b) => a.order - b.order)
                  .map((imagem) => (
                    <div key={imagem.path} className="space-y-1">
                      <img
                        src={imagem.thumbUrl ?? imagem.url}
                        alt={imagem.alt || imagem.caption || valores.title}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                      {imagem.caption && (
                        <p className="truncate text-xs text-muted-foreground">{imagem.caption}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
