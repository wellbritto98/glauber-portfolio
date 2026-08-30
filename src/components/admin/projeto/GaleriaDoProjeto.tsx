import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ImagePlus, Trash2, TriangleAlert, X } from 'lucide-react'
import {
  ErroDeUpload,
  UploadCancelado,
  apagarImagem,
  enviarImagem,
  validarArquivo,
} from '@/lib/upload'
import type { GalleryImage } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface GaleriaDoProjetoProps {
  /** Pasta no Storage, sem barra final. Ex.: `projects/abc123`. */
  pasta: string
  valor: GalleryImage[]
  onChange: (galeria: GalleryImage[]) => void
}

interface EnvioEmAndamento {
  chave: string
  nome: string
  progresso: number
}

/**
 * Galeria de imagens do projeto: envio múltiplo em sequência (uma barra de
 * progresso por arquivo), legenda e texto alternativo por imagem, e
 * reordenação por arrastar.
 */
export function GaleriaDoProjeto({ pasta, valor, onChange }: GaleriaDoProjetoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false)
  const [envios, setEnvios] = useState<EnvioEmAndamento[]>([])
  const cancelamentosRef = useRef<Map<string, () => void>>(new Map())

  // O `valor` do formulário só reflete o novo item depois de um ciclo de
  // renderização. Como os envios rodam em sequência, guardamos a versão mais
  // recente numa ref para o próximo arquivo da fila não sobrescrever o
  // anterior com um `valor` desatualizado.
  const valorRef = useRef(valor)
  useEffect(() => {
    valorRef.current = valor
  }, [valor])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const enviarArquivos = useCallback(
    async (arquivos: File[]) => {
      for (const arquivo of arquivos) {
        const problema = validarArquivo(arquivo)
        if (problema) {
          toast.error(problema)
          continue
        }

        const chave = crypto.randomUUID()
        setEnvios((prev) => [...prev, { chave, nome: arquivo.name, progresso: 0 }])

        const controle = enviarImagem({
          arquivo,
          pasta,
          onProgresso: (progresso) => {
            setEnvios((prev) => prev.map((e) => (e.chave === chave ? { ...e, progresso } : e)))
          },
        })
        cancelamentosRef.current.set(chave, controle.cancelar)

        try {
          // eslint-disable-next-line no-await-in-loop
          const imagem = await controle.promessa
          const novaGaleria = [
            ...valorRef.current,
            { ...imagem, caption: '', order: valorRef.current.length },
          ]
          valorRef.current = novaGaleria
          onChange(novaGaleria)
        } catch (erro) {
          if (erro instanceof UploadCancelado) toast.info(`Envio de "${arquivo.name}" cancelado.`)
          else if (erro instanceof ErroDeUpload) toast.error(erro.message)
          else toast.error(`Não foi possível enviar "${arquivo.name}". Tente de novo.`)
        } finally {
          cancelamentosRef.current.delete(chave)
          setEnvios((prev) => prev.filter((e) => e.chave !== chave))
        }
      }
    },
    [pasta, onChange],
  )

  function handleFileInput(evento: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? [])
    if (arquivos.length > 0) void enviarArquivos(arquivos)
    evento.target.value = ''
  }

  async function remover(imagem: GalleryImage) {
    try {
      await apagarImagem(imagem)
      const restante = valor
        .filter((img) => img.path !== imagem.path)
        .map((img, indice) => ({ ...img, order: indice }))
      onChange(restante)
      toast.success('Imagem removida da galeria.')
    } catch {
      toast.error('Não foi possível remover a imagem. Tente de novo.')
    }
  }

  function atualizarItem(caminho: string, alteracoes: Partial<GalleryImage>) {
    onChange(valor.map((img) => (img.path === caminho ? { ...img, ...alteracoes } : img)))
  }

  function handleDragEnd(evento: DragEndEvent) {
    const { active, over } = evento
    if (!over || active.id === over.id) return
    const indiceAntigo = valor.findIndex((img) => img.path === active.id)
    const indiceNovo = valor.findIndex((img) => img.path === over.id)
    if (indiceAntigo === -1 || indiceNovo === -1) return
    const reordenada = arrayMove(valor, indiceAntigo, indiceNovo).map((img, indice) => ({
      ...img,
      order: indice,
    }))
    onChange(reordenada)
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Galeria</Label>
        <p className="text-sm text-muted-foreground">
          Imagens adicionais do projeto, exibidas na página do trabalho.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setArrastandoArquivo(true)
        }}
        onDragLeave={() => setArrastandoArquivo(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastandoArquivo(false)
          const arquivos = Array.from(e.dataTransfer.files)
          if (arquivos.length > 0) void enviarArquivos(arquivos)
        }}
        className={cn(
          'rounded-md border border-dashed p-6 text-center transition-colors',
          arrastandoArquivo && 'border-primary bg-accent',
        )}
      >
        <div className="space-y-2">
          <ImagePlus className="mx-auto size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Arraste imagens aqui ou{' '}
            <button
              type="button"
              className="font-medium text-primary underline underline-offset-2"
              onClick={() => inputRef.current?.click()}
            >
              escolha os arquivos
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WebP, até 10 MB cada. Você pode selecionar várias de uma vez.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileInput}
        />
      </div>

      {envios.length > 0 && (
        <ul className="space-y-2">
          {envios.map((envio) => (
            <li key={envio.chave} className="rounded-md border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{envio.nome}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => cancelamentosRef.current.get(envio.chave)?.()}
                  aria-label={`Cancelar envio de "${envio.nome}"`}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={envio.progresso}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso do envio de "${envio.nome}"`}
              >
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${envio.progresso}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {valor.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={valor.map((img) => img.path)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {valor.map((imagem) => (
                <ItemDaGaleria
                  key={imagem.path}
                  imagem={imagem}
                  onRemover={() => void remover(imagem)}
                  onAlterar={(alteracoes) => atualizarItem(imagem.path, alteracoes)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

function ItemDaGaleria({
  imagem,
  onRemover,
  onAlterar,
}: {
  imagem: GalleryImage
  onRemover: () => void
  onAlterar: (alteracoes: Partial<GalleryImage>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: imagem.path,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const altVazio = imagem.alt.trim() === ''

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col gap-2 rounded-md border bg-card p-3',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none self-center rounded p-1 text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          aria-label={`Arrastar para reordenar imagem`}
        >
          <GripVertical className="size-4" />
        </button>
        <img
          src={imagem.thumbUrl ?? imagem.url}
          alt={imagem.alt || 'Pré-visualização'}
          width={80}
          height={80}
          loading="lazy"
          decoding="async"
          className="size-20 shrink-0 rounded object-cover"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={imagem.caption}
            placeholder="Legenda (opcional)"
            onChange={(e) => onAlterar({ caption: e.target.value })}
          />
          <Input
            value={imagem.alt}
            placeholder="Texto alternativo"
            onChange={(e) => onAlterar({ alt: e.target.value })}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onRemover}
          aria-label="Remover imagem da galeria"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {altVazio && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700">
          <TriangleAlert className="size-3.5 shrink-0" />
          Sem texto alternativo, leitores de tela não conseguem descrever esta imagem.
        </p>
      )}
    </li>
  )
}
