import { Badge } from '@/components/ui/badge'
import type { ProjectStatus } from '@/lib/schemas'

/** Traduz o status do projeto para o rótulo que o designer reconhece. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'published') {
    return <Badge>Publicado</Badge>
  }
  return <Badge variant="secondary">Rascunho</Badge>
}
