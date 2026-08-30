import { createFileRoute, Link } from '@tanstack/react-router'
import { useProjectsAdmin } from '@/hooks/useProjects'
import { useSectionsAdmin } from '@/hooks/useSections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EstadoDeErro } from '@/components/admin/EstadoDeErro'
import { FolderKanban, FileText, CheckCircle2, Layers, Plus, Settings } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const projetos = useProjectsAdmin()
  const secoes = useSectionsAdmin()

  const carregando = projetos.isPending || secoes.isPending
  const comErro = projetos.isError || secoes.isError

  if (comErro) {
    return (
      <EstadoDeErro
        mensagem="Não foi possível carregar as informações do painel."
        onTentarDeNovo={() => {
          void projetos.refetch()
          void secoes.refetch()
        }}
      />
    )
  }

  const total = projetos.data?.length ?? 0
  const publicados = projetos.data?.filter((p) => p.status === 'published').length ?? 0
  const rascunhos = total - publicados
  const totalSecoes = secoes.data?.length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão geral do seu portfólio.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CartaoContagem icone={FolderKanban} rotulo="Projetos" valor={total} carregando={carregando} />
        <CartaoContagem icone={CheckCircle2} rotulo="Publicados" valor={publicados} carregando={carregando} />
        <CartaoContagem icone={FileText} rotulo="Rascunhos" valor={rascunhos} carregando={carregando} />
        <CartaoContagem icone={Layers} rotulo="Seções" valor={totalSecoes} carregando={carregando} />
      </div>

      {!carregando && total === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <FolderKanban className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum projeto ainda. Clique em <strong>Novo projeto</strong> para começar.
            </p>
            <Button asChild size="sm">
              <Link to="/admin/projetos/novo">
                <Plus className="size-4" />
                Novo projeto
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-heading text-sm font-semibold text-foreground/80">Atalhos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AtalhoCard to="/admin/projetos/novo" icone={Plus} titulo="Novo projeto" descricao="Adicione um trabalho ao portfólio" />
          <AtalhoCard to="/admin/projetos" icone={FolderKanban} titulo="Gerenciar projetos" descricao="Editar, reordenar ou excluir" />
          <AtalhoCard to="/admin/secoes" icone={Layers} titulo="Seções" descricao="Organize as categorias" />
          <AtalhoCard to="/admin/configuracoes" icone={Settings} titulo="Configurações" descricao="Dados do site e do perfil" />
        </div>
      </div>
    </div>
  )
}

function CartaoContagem({
  icone: Icone,
  rotulo,
  valor,
  carregando,
}: {
  icone: React.ComponentType<{ className?: string }>
  rotulo: string
  valor: number
  carregando: boolean
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icone className="size-3.5" />
          {rotulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {carregando ? <Skeleton className="h-7 w-10" /> : <p className="text-2xl font-semibold">{valor}</p>}
      </CardContent>
    </Card>
  )
}

type RotaAtalho = '/admin/projetos/novo' | '/admin/projetos' | '/admin/secoes' | '/admin/configuracoes'

function AtalhoCard({
  to,
  icone: Icone,
  titulo,
  descricao,
}: {
  to: RotaAtalho
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  descricao: string
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/50"
    >
      <Icone className="size-5 text-primary" />
      <span className="font-heading text-sm font-medium">{titulo}</span>
      <span className="text-xs text-muted-foreground">{descricao}</span>
    </Link>
  )
}
