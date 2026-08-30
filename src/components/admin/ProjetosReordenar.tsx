import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReorderProjects } from '@/hooks/useProjectMutations'
import { MiniaturaProjeto } from '@/components/admin/MiniaturaProjeto'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { Project, Section } from '@/lib/schemas'

/**
 * Modo de reordenação manual: sempre opera sobre a lista completa, sem
 * filtros. Misturar reordenar com um recorte filtrado deixaria os índices
 * de `order` inconsistentes com o restante dos projetos ocultos pelo filtro.
 */
export function ProjetosReordenar({
  projetos,
  secoesPorId,
}: {
  projetos: Project[]
  secoesPorId: Map<string, Section>
}) {
  const reordenar = useReorderProjects()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(evento: DragEndEvent) {
    const { active, over } = evento
    if (!over || active.id === over.id) return
    const indiceAntigo = projetos.findIndex((p) => p.id === active.id)
    const indiceNovo = projetos.findIndex((p) => p.id === over.id)
    if (indiceAntigo === -1 || indiceNovo === -1) return
    reordenar.mutate(arrayMove(projetos, indiceAntigo, indiceNovo))
  }

  if (projetos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
        <FolderKanban className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum projeto para reordenar ainda.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Arraste os projetos para definir a ordem em que aparecem no site.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projetos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {projetos.map((projeto) => (
              <ItemReordenavel
                key={projeto.id}
                projeto={projeto}
                nomeSecao={secoesPorId.get(projeto.sectionId)?.name}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function ItemReordenavel({ projeto, nomeSecao }: { projeto: Project; nomeSecao?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: projeto.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-2.5',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1.5 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        aria-label={`Arrastar para reordenar "${projeto.title}"`}
      >
        <GripVertical className="size-4" />
      </button>
      <MiniaturaProjeto projeto={projeto} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{projeto.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {nomeSecao ?? 'Sem seção'} · {projeto.year}
        </p>
      </div>
      <StatusBadge status={projeto.status} />
    </li>
  )
}
