import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Plus, Settings, Trash2 } from 'lucide-react'
import { useSiteSettings, useUpdateSiteSettings } from '@/hooks/useSiteSettings'
import { siteSettingsInputSchema, type SiteSettingsInput } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EstadoDeErro } from '@/components/admin/EstadoDeErro'
import { CampoDeImagemSimples } from '@/components/admin/config/CampoDeImagemSimples'

export const Route = createFileRoute('/admin/configuracoes')({
  component: AdminConfiguracoes,
})

/** Mensagens de erro de um campo do TanStack Form, já normalizadas em texto. */
function Erros({ erros }: { erros: unknown[] }) {
  if (erros.length === 0) return null
  return (
    <p role="alert" className="text-xs text-destructive">
      {erros
        .map((erro) =>
          typeof erro === 'object' && erro !== null && 'message' in erro
            ? String((erro as { message: unknown }).message)
            : String(erro),
        )
        .join(', ')}
    </p>
  )
}

function Ajuda({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

function AdminConfiguracoes() {
  const consulta = useSiteSettings()
  const salvar = useUpdateSiteSettings()

  if (consulta.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (consulta.isError || !consulta.data) {
    return (
      <EstadoDeErro
        mensagem="Não foi possível carregar as configurações do site."
        onTentarDeNovo={() => void consulta.refetch()}
      />
    )
  }

  return <Formulario iniciais={consulta.data} salvar={salvar} />
}

function Formulario({
  iniciais,
  salvar,
}: {
  iniciais: SiteSettingsInput
  salvar: ReturnType<typeof useUpdateSiteSettings>
}) {
  const form = useForm({
    defaultValues: iniciais,
    onSubmit: async ({ value }) => {
      try {
        await salvar.mutateAsync(value)
        toast.success('Configurações salvas.')
      } catch {
        toast.error('Não foi possível salvar. Tente de novo em instantes.')
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
      className="space-y-6"
    >
      <header className="flex items-center gap-3">
        <Settings className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Configurações do site</h1>
          <p className="text-sm text-muted-foreground">
            Textos e informações que aparecem no site público.
          </p>
        </div>
      </header>

      <Tabs defaultValue="identidade">
        <TabsList>
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="contato">Contato</TabsTrigger>
          <TabsTrigger value="redes">Redes sociais</TabsTrigger>
          <TabsTrigger value="compartilhamento">Compartilhamento</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------- */}
        <TabsContent value="identidade" className="max-w-2xl space-y-5 pt-4">
          <form.Field name="ownerName">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Seu nome</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>Aparece no topo de todas as páginas e no rodapé.</Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="headline">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Frase de abertura</Label>
                <Textarea
                  id={field.name}
                  rows={2}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>
                  É a primeira coisa que aparece na página inicial, em letras grandes.
                </Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="bio">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Sobre você</Label>
                <Textarea
                  id={field.name}
                  rows={10}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>
                  Texto da página &ldquo;Sobre&rdquo;. Pode usar vários parágrafos — as
                  quebras de linha são preservadas no site.
                </Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="profileImage">
            {(field) => (
              <CampoDeImagemSimples
                valor={field.state.value}
                onChange={field.handleChange}
                rotulo="Sua foto"
                descricao="Aparece na página Sobre."
              />
            )}
          </form.Field>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        <TabsContent value="contato" className="max-w-2xl space-y-5 pt-4">
          <form.Field name="email" validators={{ onChange: siteSettingsInputSchema.shape.email.unwrap() }}>
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>E-mail</Label>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>Aparece no rodapé e na página Sobre. Deixe vazio para não exibir.</Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Telefone</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>Opcional. Deixe vazio para não exibir.</Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Cidade</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>Ex.: São Paulo, SP.</Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field
            name="resumeUrl"
            validators={{ onChange: siteSettingsInputSchema.shape.resumeUrl.unwrap() }}
          >
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Link do currículo</Label>
                <Input
                  id={field.name}
                  placeholder="https://..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>
                  Endereço de um PDF hospedado em outro lugar (Google Drive, Dropbox). Se
                  preenchido, vira um botão na página Sobre.
                </Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        <TabsContent value="redes" className="max-w-2xl space-y-4 pt-4">
          <form.Field name="socials" mode="array">
            {(field) => (
              <div className="space-y-3">
                {field.state.value.length === 0 && (
                  <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nenhuma rede social ainda. Clique em Adicionar rede para incluir a
                    primeira.
                  </p>
                )}

                {field.state.value.map((_, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-md border p-3">
                    <form.Field name={`socials[${i}].platform`}>
                      {(sub) => (
                        <div className="w-40 space-y-1.5">
                          <Label htmlFor={sub.name}>Rede</Label>
                          <Input
                            id={sub.name}
                            placeholder="Instagram"
                            value={sub.state.value}
                            onBlur={sub.handleBlur}
                            onChange={(e) => sub.handleChange(e.target.value)}
                          />
                          <Erros erros={sub.state.meta.errors} />
                        </div>
                      )}
                    </form.Field>

                    <form.Field name={`socials[${i}].url`}>
                      {(sub) => (
                        <div className="flex-1 space-y-1.5">
                          <Label htmlFor={sub.name}>Endereço</Label>
                          <Input
                            id={sub.name}
                            placeholder="https://instagram.com/seu-perfil"
                            value={sub.state.value}
                            onBlur={sub.handleBlur}
                            onChange={(e) => sub.handleChange(e.target.value)}
                          />
                          <Erros erros={sub.state.meta.errors} />
                        </div>
                      )}
                    </form.Field>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover rede ${i + 1}`}
                      onClick={() => field.removeValue(i)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.pushValue({ platform: '', url: '' })}
                >
                  <Plus className="size-4" />
                  Adicionar rede
                </Button>
              </div>
            )}
          </form.Field>
        </TabsContent>

        {/* ---------------------------------------------------------- */}
        <TabsContent value="compartilhamento" className="max-w-2xl space-y-5 pt-4">
          <p className="rounded-md border-l-2 border-muted-foreground/40 bg-muted/40 p-3 text-sm text-muted-foreground">
            Estes campos definem o que aparece quando alguém compartilha o endereço do seu
            site no WhatsApp, Instagram ou Google.
          </p>

          <form.Field name="seo.title">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Título</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>Ex.: Seu Nome — Design gráfico.</Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="seo.description">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Descrição</Label>
                <Textarea
                  id={field.name}
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <Ajuda>Uma ou duas frases. Aparece abaixo do título nos resultados de busca.</Ajuda>
                <Erros erros={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="seo.ogImage">
            {(field) => (
              <CampoDeImagemSimples
                valor={field.state.value}
                onChange={field.handleChange}
                rotulo="Imagem de compartilhamento"
                descricao="Aparece no cartão do link. O formato ideal é retangular, tipo 1200 × 630 pixels."
              />
            )}
          </form.Field>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3 border-t pt-4">
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
