import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from '@tanstack/react-form'
import { Link, useBlocker, useNavigate } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { gerarSlug } from '@/lib/slug'
import { projectInputSchema, type ProjectInput, type ProjectStatus } from '@/lib/schemas'
import { slugEstaEmUso, useCreateProject, useUpdateProject } from '@/hooks/useProjectMutations'
import { useSectionsAdmin } from '@/hooks/useSections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CampoDeImagem } from '@/components/admin/CampoDeImagem'
import { CampoDeTags } from './CampoDeTags'
import { GaleriaDoProjeto } from './GaleriaDoProjeto'
import { PreviewProjetoDialog } from './PreviewProjetoDialog'
import { cn } from '@/lib/utils'

export interface FormularioProjetoProps {
  /**
   * Id do projeto. No modo "novo" já foi gerado antes de montar este
   * componente (ver `admin.projetos.novo.tsx`), porque o caminho das imagens
   * no Storage (`projects/{id}/...`) precisa existir antes do primeiro envio.
   */
  projectId: string
  modo: 'novo' | 'editar'
  valoresIniciais: ProjectInput
}

/** Mostra as mensagens de validação de um campo, quando houver. */
function ErroDoCampo({ erros }: { erros: unknown[] }) {
  if (erros.length === 0) return null
  return (
    <p role="alert" className="text-xs text-destructive">
      {erros
        .map((erro) => {
          if (typeof erro === 'string') return erro
          if (erro && typeof erro === 'object' && 'message' in erro) {
            return String((erro as { message?: unknown }).message ?? erro)
          }
          return String(erro)
        })
        .join(', ')}
    </p>
  )
}

/**
 * Formulário de projeto, compartilhado entre criação e edição. A rota que o
 * usa decide de onde vêm os valores iniciais e passa o `projectId` já
 * definido — o restante (validação, envio de imagens, salvar como rascunho
 * ou publicar) é responsabilidade deste componente.
 */
export function FormularioProjeto({ projectId, modo, valoresIniciais }: FormularioProjetoProps) {
  const navigate = useNavigate()
  const secoesQuery = useSectionsAdmin()
  const criar = useCreateProject()
  const atualizar = useUpdateProject()
  const mutation = modo === 'novo' ? criar : atualizar

  // No modo edição o slug já existe e não deve mudar sozinho quando o
  // designer ajusta o título; no modo criação, segue o título até que o
  // slug seja editado manualmente pela primeira vez.
  const slugEditadoManualmenteRef = useRef(modo === 'editar')
  const statusAlvoRef = useRef<ProjectStatus>('draft')
  const salvoComSucessoRef = useRef(false)

  const [capaDestacada, setCapaDestacada] = useState(false)
  const [previewAberto, setPreviewAberto] = useState(false)
  const [acaoAtual, setAcaoAtual] = useState<ProjectStatus | null>(null)

  const form = useForm({
    defaultValues: valoresIniciais,
    onSubmit: async ({ value }) => {
      const status = statusAlvoRef.current

      if (status === 'published' && !value.coverImage) {
        toast.error('Um projeto publicado precisa de imagem de capa.')
        setCapaDestacada(true)
        return
      }
      setCapaDestacada(false)

      setAcaoAtual(status)
      try {
        await mutation.mutateAsync({ id: projectId, valores: { ...value, status } })
        toast.success(status === 'published' ? 'Projeto publicado.' : 'Rascunho salvo.')
        salvoComSucessoRef.current = true
        await navigate({ to: '/admin/projetos' })
      } catch {
        toast.error('Não foi possível salvar o projeto. Tente de novo.')
      } finally {
        setAcaoAtual(null)
      }
    },
  })

  function salvarComo(status: ProjectStatus) {
    statusAlvoRef.current = status
    void form.handleSubmit()
  }

  // Aviso ao sair com alterações não salvas: bloqueia navegação dentro do
  // app com uma confirmação, e cobre fechar/recarregar a aba com o
  // `beforeunload` nativo.
  useBlocker({
    shouldBlockFn: () => {
      if (salvoComSucessoRef.current || !form.state.isDirty) return false
      return !window.confirm(
        'Você tem alterações não salvas neste projeto. Se sair agora, elas serão perdidas. Deseja sair mesmo assim?',
      )
    },
    enableBeforeUnload: () => !salvoComSucessoRef.current && form.state.isDirty,
  })

  const semSecoes = secoesQuery.isSuccess && secoesQuery.data.length === 0

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          evento.stopPropagation()
          salvarComo('draft')
        }}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field
                  name="title"
                  validators={{ onChange: projectInputSchema.shape.title }}
                >
                  {(field) => (
                    <div className="space-y-1">
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(evento) => {
                          const novoTitulo = evento.target.value
                          field.handleChange(novoTitulo)
                          if (!slugEditadoManualmenteRef.current) {
                            form.setFieldValue('slug', gerarSlug(novoTitulo))
                          }
                        }}
                      />
                      <ErroDoCampo erros={field.state.meta.errors} />
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="slug"
                  validators={{
                    onChange: projectInputSchema.shape.slug,
                    onChangeAsync: async ({ value }) => {
                      if (!value) return undefined
                      const emUso = await slugEstaEmUso(value, projectId)
                      return emUso ? 'Já existe um projeto com este endereço.' : undefined
                    },
                    onChangeAsyncDebounceMs: 400,
                  }}
                >
                  {(field) => (
                    <div className="space-y-1">
                      <Label htmlFor="endereco">Endereço no site</Label>
                      <Input
                        id="endereco"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(evento) => {
                          slugEditadoManualmenteRef.current = true
                          field.handleChange(evento.target.value)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        /projetos/{field.state.value || '...'}
                        {field.state.meta.isValidating && ' · verificando disponibilidade…'}
                      </p>
                      <ErroDoCampo erros={field.state.meta.errors} />
                    </div>
                  )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <form.Field
                    name="sectionId"
                    validators={{ onChange: projectInputSchema.shape.sectionId }}
                  >
                    {(field) => (
                      <div className="space-y-1">
                        <Label htmlFor="secao">Seção</Label>
                        {semSecoes ? (
                          <div className="flex flex-col gap-2 rounded-md border border-dashed border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
                            <p>
                              Você ainda não criou nenhuma seção. Crie uma seção antes de
                              cadastrar projetos.
                            </p>
                            <Button asChild variant="outline" size="sm" className="w-fit">
                              <Link to="/admin/secoes">Criar seção</Link>
                            </Button>
                          </div>
                        ) : (
                          <Select
                            value={field.state.value}
                            onValueChange={field.handleChange}
                            disabled={secoesQuery.isPending}
                          >
                            <SelectTrigger id="secao" className="w-full">
                              <SelectValue
                                placeholder={
                                  secoesQuery.isPending
                                    ? 'Carregando seções…'
                                    : 'Escolha uma seção'
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {secoesQuery.data?.map((secao) => (
                                <SelectItem key={secao.id} value={secao.id}>
                                  {secao.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <ErroDoCampo erros={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="year" validators={{ onChange: projectInputSchema.shape.year }}>
                    {(field) => (
                      <div className="space-y-1">
                        <Label htmlFor="ano">Ano</Label>
                        <Input
                          id="ano"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="2026"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(evento) =>
                            field.handleChange(evento.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                        />
                        <ErroDoCampo erros={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <form.Field name="client">
                    {(field) => (
                      <div className="space-y-1">
                        <Label htmlFor="cliente">Cliente</Label>
                        <Input
                          id="cliente"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(evento) => field.handleChange(evento.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="role">
                    {(field) => (
                      <div className="space-y-1">
                        <Label htmlFor="papel">Papel</Label>
                        <Input
                          id="papel"
                          placeholder="Direção de arte, ilustração"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(evento) => field.handleChange(evento.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>
                </div>

                <form.Field name="description">
                  {(field) => (
                    <div className="space-y-1">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        className="min-h-40"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(evento) => field.handleChange(evento.target.value)}
                      />
                    </div>
                  )}
                </form.Field>

                <form.Field name="tags">
                  {(field) => <CampoDeTags valor={field.state.value} onChange={field.handleChange} />}
                </form.Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Galeria</CardTitle>
              </CardHeader>
              <CardContent>
                <form.Field name="gallery">
                  {(field) => (
                    <GaleriaDoProjeto
                      pasta={`projects/${projectId}`}
                      valor={field.state.value}
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Capa</CardTitle>
              </CardHeader>
              <CardContent>
                <form.Field name="coverImage">
                  {(field) => (
                    <div
                      className={cn(
                        capaDestacada && !field.state.value && 'rounded-md ring-2 ring-destructive',
                      )}
                    >
                      <CampoDeImagem
                        valor={field.state.value}
                        onChange={(imagem) => {
                          field.handleChange(imagem)
                          if (imagem) setCapaDestacada(false)
                        }}
                        pasta={`projects/${projectId}`}
                        rotulo="Imagem de capa"
                        descricao="Usada nas listagens do site e como imagem principal da página do projeto."
                      />
                      {capaDestacada && !field.state.value && (
                        <p role="alert" className="mt-1 text-xs text-destructive">
                          Um projeto publicado precisa de imagem de capa.
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4">
                <form.Field name="featured">
                  {(field) => (
                    <div className="flex items-center gap-2">
                      <Switch
                        id="destaque"
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                      <Label htmlFor="destaque">Aparece em destaque na home</Label>
                    </div>
                  )}
                </form.Field>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPreviewAberto(true)}
                >
                  <Eye className="size-4" />
                  Pré-visualizar
                </Button>

                <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                  {([canSubmit, isSubmitting]) => (
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={!canSubmit || isSubmitting}
                        onClick={() => salvarComo('draft')}
                      >
                        {isSubmitting && acaoAtual === 'draft' ? 'Salvando…' : 'Salvar como rascunho'}
                      </Button>
                      <Button
                        type="button"
                        className="w-full"
                        disabled={!canSubmit || isSubmitting}
                        onClick={() => salvarComo('published')}
                      >
                        {isSubmitting && acaoAtual === 'published' ? 'Publicando…' : 'Publicar'}
                      </Button>
                    </div>
                  )}
                </form.Subscribe>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      <form.Subscribe selector={(state) => state.values}>
        {(valores) => (
          <PreviewProjetoDialog
            aberto={previewAberto}
            onOpenChange={setPreviewAberto}
            valores={valores}
            nomeDaSecao={secoesQuery.data?.find((secao) => secao.id === valores.sectionId)?.name}
          />
        )}
      </form.Subscribe>
    </div>
  )
}
