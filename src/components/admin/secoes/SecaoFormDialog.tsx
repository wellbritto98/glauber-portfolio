import { useRef } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { gerarSlug } from '@/lib/slug'
import { useCreateSection, useUpdateSection } from '@/hooks/useSectionMutations'
import { sectionInputSchema, type Section, type SectionInput } from '@/lib/schemas'

interface SecaoFormDialogProps {
  open: boolean
  /** `null` cria uma seção nova; um valor edita a seção informada. */
  secao: Section | null
  /** Posição a usar quando estiver criando — sempre o fim da lista atual. */
  proximaOrdem: number
  onOpenChange: (aberto: boolean) => void
}

/**
 * Dialog de criação/edição de seção. O conteúdo interno é remontado pelo
 * componente pai (via `key`) sempre que o alvo muda, para que o TanStack
 * Form comece cada edição com os valores certos.
 */
export function SecaoFormDialog({ open, secao, proximaOrdem, onOpenChange }: SecaoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <SecaoFormConteudo secao={secao} proximaOrdem={proximaOrdem} onConcluir={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function SecaoFormConteudo({
  secao,
  proximaOrdem,
  onConcluir,
}: {
  secao: Section | null
  proximaOrdem: number
  onConcluir: () => void
}) {
  const criar = useCreateSection()
  const atualizar = useUpdateSection()

  // Em edição, o endereço já existe e não deve ser reescrito sozinho quando
  // o nome muda — só quando o próprio campo de endereço for editado à mão.
  // Em criação, ele acompanha o nome até isso acontecer.
  const slugEditadoManualmente = useRef(secao !== null)

  const form = useForm({
    defaultValues: {
      name: secao?.name ?? '',
      slug: secao?.slug ?? '',
      description: secao?.description ?? '',
      order: secao?.order ?? proximaOrdem,
      visible: secao?.visible ?? true,
    } satisfies SectionInput,
    onSubmit: async ({ value }) => {
      try {
        if (secao) {
          await atualizar.mutateAsync({ id: secao.id, valores: value })
          toast.success('Seção atualizada.')
        } else {
          await criar.mutateAsync(value)
          toast.success('Seção criada.')
        }
        onConcluir()
      } catch {
        toast.error('Não foi possível salvar a seção. Tente de novo.')
      }
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>{secao ? 'Editar seção' : 'Nova seção'}</DialogTitle>
        <DialogDescription>
          Seções organizam os projetos em grupos no site, como "Identidade visual" ou "Ilustração".
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          evento.stopPropagation()
          void form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name" validators={{ onChange: sectionInputSchema.shape.name }}>
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Nome</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                autoFocus
                onChange={(evento) => {
                  const valor = evento.target.value
                  field.handleChange(valor)
                  if (!slugEditadoManualmente.current) {
                    form.setFieldValue('slug', gerarSlug(valor))
                  }
                }}
              />
              {field.state.meta.errors.length > 0 && (
                <p role="alert" className="text-xs text-destructive">
                  {field.state.meta.errors.map((erro) => erro?.message ?? String(erro)).join(', ')}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="slug" validators={{ onChange: sectionInputSchema.shape.slug }}>
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Endereço</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(evento) => {
                  slugEditadoManualmente.current = true
                  field.handleChange(evento.target.value)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Gerado a partir do nome. Faz parte do endereço da seção no site — evite alterar depois de
                publicada.
              </p>
              {field.state.meta.errors.length > 0 && (
                <p role="alert" className="text-xs text-destructive">
                  {field.state.meta.errors.map((erro) => erro?.message ?? String(erro)).join(', ')}
                </p>
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Descrição (opcional)</Label>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(evento) => field.handleChange(evento.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Aparece no topo desta seção no site.</p>
            </div>
          )}
        </form.Field>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onConcluir}>
            Cancelar
          </Button>
          <form.Subscribe selector={(estado) => [estado.canSubmit, estado.isSubmitting] as const}>
            {([podeEnviar, enviando]) => (
              <Button type="submit" disabled={!podeEnviar || enviando}>
                {enviando ? 'Salvando…' : 'Salvar'}
              </Button>
            )}
          </form.Subscribe>
        </DialogFooter>
      </form>
    </>
  )
}
