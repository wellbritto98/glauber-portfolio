import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, FolderX } from 'lucide-react'
import { useProjectById } from '@/hooks/useProject'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FormularioProjeto } from '@/components/admin/projeto/FormularioProjeto'
import type { ProjectInput } from '@/lib/schemas'

export const Route = createFileRoute('/admin/projetos/$id')({
  component: AdminProjetoEditar,
})

function AdminProjetoEditar() {
  const { id } = Route.useParams()
  const projetoQuery = useProjectById(id)

  if (projetoQuery.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (projetoQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Não foi possível carregar este projeto.</p>
        <Button variant="outline" size="sm" onClick={() => void projetoQuery.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  const projeto = projetoQuery.data
  if (!projeto) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <FolderX className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Este projeto não existe ou foi excluído.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/projetos">Voltar para projetos</Link>
        </Button>
      </div>
    )
  }

  const valoresIniciais: ProjectInput = {
    title: projeto.title,
    slug: projeto.slug,
    sectionId: projeto.sectionId,
    year: projeto.year,
    client: projeto.client,
    role: projeto.role,
    description: projeto.description,
    coverImage: projeto.coverImage,
    gallery: projeto.gallery,
    tags: projeto.tags,
    featured: projeto.featured,
    status: projeto.status,
    order: projeto.order,
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-xl font-semibold">Editar projeto</h1>
        <p className="text-sm text-muted-foreground">{projeto.title}</p>
      </div>
      <FormularioProjeto
        key={projeto.id}
        projectId={projeto.id}
        modo="editar"
        valoresIniciais={valoresIniciais}
      />
    </div>
  )
}
