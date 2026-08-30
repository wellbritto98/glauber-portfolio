import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { novoProjectId } from '@/hooks/useProjectMutations'
import { FormularioProjeto } from '@/components/admin/projeto/FormularioProjeto'
import type { ProjectInput } from '@/lib/schemas'

export const Route = createFileRoute('/admin/projetos/novo')({
  component: AdminProjetoNovo,
})

const valoresPadrao: ProjectInput = {
  title: '',
  slug: '',
  sectionId: '',
  year: String(new Date().getFullYear()),
  client: '',
  role: '',
  description: '',
  coverImage: null,
  gallery: [],
  tags: [],
  featured: false,
  status: 'draft',
  order: 0,
}

function AdminProjetoNovo() {
  // Gerado uma única vez: o caminho das imagens no Storage
  // (`projects/{id}/...`) precisa existir antes do primeiro envio, e um novo
  // id a cada render apagaria o vínculo com imagens já enviadas.
  const [projectId] = useState(() => novoProjectId())

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-xl font-semibold">Novo projeto</h1>
        <p className="text-sm text-muted-foreground">
          Preencha as informações e publique quando estiver pronto. Você também pode salvar como
          rascunho e continuar depois.
        </p>
      </div>
      <FormularioProjeto projectId={projectId} modo="novo" valoresIniciais={valoresPadrao} />
    </div>
  )
}
