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
import { GripVertical, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useReorderSections, useUpdateSection } from '@/hooks/useSectionMutations'
import type { Section, SectionInput } from '@/lib/schemas'

/**
 * Lista arrastável das seções. Sempre opera sobre a lista inteira (sem
 * filtro), já que reordenar é redefinir o campo `order` de todo mundo.
 */
export function SecoesLista({
  secoes,
  onEditar,
  onExcluir,
  idVerificandoExclusao,
}: {
  secoes: Section[]
  onEditar: (secao: Section) => void
  onExcluir: (secao: Section) => void
  /** id da seção cuja checagem de exclusão está em andamento, se houver. */
  idVerificandoExclusao: string | null
}) {
  const reordenar = useReorderSections()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(evento: DragEndEvent) {
    const { active, over } = evento
    if (!over || active.id === over.id) return
    const indiceAntigo = secoes.findIndex((s) => s.id === active.id)
    const indiceNovo = secoes.findIndex((s) => s.id === over.id)
    if (indiceAntigo === -1 || indiceNovo === -1) return
    reordenar.mutate(arrayMove(secoes, indiceAntigo, indiceNovo))
  }

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Arraste para definir a ordem em que as seções aparecem no site.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={secoes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {secoes.map((secao) => (
              <ItemSecao
                key={secao.id}
                secao={secao}
                onEditar={onEditar}
                onExcluir={onExcluir}
                verificandoExclusao={idVerificandoExclusao === secao.id}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function ItemSecao({
  secao,
  onEditar,
  onExcluir,
  verificandoExclusao,
}: {
  secao: Section
  onEditar: (secao: Section) => void
  onExcluir: (secao: Section) => void
  verificandoExclusao: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: secao.id })
  const atualizar = useUpdateSection()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function alternarVisibilidade(visivel: boolean) {
    const valores: SectionInput = {
      name: secao.name,
      slug: secao.slug,
      description: secao.description,
      order: secao.order,
      visible: visivel,
    }
    atualizar.mutate(
      { id: secao.id, valores },
      {
        onSuccess: () => {
          toast.success(visivel ? 'Seção agora está visível no site.' : 'Seção ocultada do site.')
        },
        onError: () => toast.error('Não foi possível atualizar a seção. Tente de novo.'),
      },
    )
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card p-3',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1.5 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        aria-label={`Arrastar para reordenar "${secao.name}"`}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{secao.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          /{secao.slug}
          {secao.description && ` · ${secao.description}`}
        </p>
      </div>

      <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Visível no site</span>
        <Switch
          checked={secao.visible}
          onCheckedChange={alternarVisibilidade}
          disabled={atualizar.isPending}
          aria-label={`Visível no site: ${secao.name}`}
        />
      </label>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Editar "${secao.name}"`}
          onClick={() => onEditar(secao)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Excluir "${secao.name}"`}
          disabled={verificandoExclusao}
          onClick={() => onExcluir(secao)}
        >
          {verificandoExclusao ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>
    </li>
  )
}
