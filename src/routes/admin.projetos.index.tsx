import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { Plus, FolderKanban } from 'lucide-react'
import { useProjectsAdmin } from '@/hooks/useProjects'
import { useSectionsAdmin } from '@/hooks/useSections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EstadoDeErro } from '@/components/admin/EstadoDeErro'
import { ProjetosTabela } from '@/components/admin/ProjetosTabela'
import { ProjetosReordenar } from '@/components/admin/ProjetosReordenar'
import { ExcluirProjetoDialog } from '@/components/admin/ExcluirProjetoDialog'
import type { Project, Section } from '@/lib/schemas'

const projetosSearchSchema = z.object({
  busca: z.string().optional(),
  secao: z.string().optional(),
  status: z.enum(['draft', 'published', 'todos']).optional(),
})

export const Route = createFileRoute('/admin/projetos/')({
  validateSearch: (search) => projetosSearchSchema.parse(search),
  component: AdminProjetos,
})

type Modo = 'tabela' | 'reordenar'

function AdminProjetos() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [modo, setModo] = useState<Modo>('tabela')
  const [projetoParaExcluir, setProjetoParaExcluir] = useState<Project | null>(null)

  const projetosQuery = useProjectsAdmin()
  const secoesQuery = useSectionsAdmin()

  const secoesPorId = useMemo(() => {
    const mapa = new Map<string, Section>()
    secoesQuery.data?.forEach((secao) => mapa.set(secao.id, secao))
    return mapa
  }, [secoesQuery.data])

  const filtrados = useMemo(() => {
    if (!projetosQuery.data) return []
    const busca = search.busca?.trim().toLowerCase()
    return projetosQuery.data.filter((projeto) => {
      if (search.status && search.status !== 'todos' && projeto.status !== search.status) return false
      if (search.secao && projeto.sectionId !== search.secao) return false
      if (busca && !projeto.title.toLowerCase().includes(busca)) return false
      return true
    })
  }, [projetosQuery.data, search.busca, search.secao, search.status])

  if (projetosQuery.isError || secoesQuery.isError) {
    return (
      <EstadoDeErro
        mensagem="Não foi possível carregar os projetos."
        onTentarDeNovo={() => {
          void projetosQuery.refetch()
          void secoesQuery.refetch()
        }}
      />
    )
  }

  const carregando = projetosQuery.isPending || secoesQuery.isPending
  const semProjetoAlgum = !carregando && (projetosQuery.data?.length ?? 0) === 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Projetos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os trabalhos do seu portfólio.</p>
        </div>
        <div className="flex items-center gap-2">
          {!semProjetoAlgum && (
            <Tabs value={modo} onValueChange={(valor) => setModo(valor as Modo)}>
              <TabsList>
                <TabsTrigger value="tabela">Lista</TabsTrigger>
                <TabsTrigger value="reordenar">Reordenar</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button asChild size="sm">
            <Link to="/admin/projetos/novo">
              <Plus className="size-4" />
              Novo projeto
            </Link>
          </Button>
        </div>
      </div>

      {carregando && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {semProjetoAlgum && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
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
        </div>
      )}

      {!carregando && !semProjetoAlgum && modo === 'tabela' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar por título..."
              value={search.busca ?? ''}
              onChange={(evento) => {
                const valor = evento.target.value
                void navigate({
                  search: (prev) => ({ ...prev, busca: valor || undefined }),
                  replace: true,
                })
              }}
              className="max-w-xs"
            />
            <Select
              value={search.secao ?? 'todas'}
              onValueChange={(valor) => {
                void navigate({
                  search: (prev) => ({ ...prev, secao: valor === 'todas' ? undefined : valor }),
                  replace: true,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as seções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as seções</SelectItem>
                {secoesQuery.data?.map((secao) => (
                  <SelectItem key={secao.id} value={secao.id}>
                    {secao.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={search.status ?? 'todos'}
              onValueChange={(valor) => {
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    status: valor === 'todos' ? undefined : (valor as 'draft' | 'published'),
                  }),
                  replace: true,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ProjetosTabela projetos={filtrados} secoesPorId={secoesPorId} onExcluir={setProjetoParaExcluir} />
        </>
      )}

      {!carregando && !semProjetoAlgum && modo === 'reordenar' && (
        <ProjetosReordenar projetos={projetosQuery.data ?? []} secoesPorId={secoesPorId} />
      )}

      <ExcluirProjetoDialog
        projeto={projetoParaExcluir}
        onOpenChange={(aberto) => {
          if (!aberto) setProjetoParaExcluir(null)
        }}
      />
    </div>
  )
}
