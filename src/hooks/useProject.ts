import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { docParaProjeto } from '@/lib/converters'
import { queryKeys } from '@/lib/queryKeys'
import { useProjects } from './useProjects'
import type { Project } from '@/lib/schemas'

export interface ProjetoComVizinhos {
  projeto: Project | null
  anterior: Project | null
  proximo: Project | null
}

/**
 * Deriva o projeto da lista já em cache, em vez de fazer uma leitura própria.
 *
 * Além de economizar uma leitura do Firestore, a lista é necessária de
 * qualquer forma para a navegação anterior/próximo no fim da página.
 */
export function useProject(slug: string) {
  const consulta = useProjects()

  const projetos = consulta.data ?? []
  const indice = projetos.findIndex((p) => p.slug === slug)

  const dados: ProjetoComVizinhos = {
    projeto: indice >= 0 ? projetos[indice] : null,
    anterior: indice > 0 ? projetos[indice - 1] : null,
    proximo: indice >= 0 && indice < projetos.length - 1 ? projetos[indice + 1] : null,
  }

  return { ...consulta, data: consulta.isSuccess ? dados : undefined }
}

/** Painel admin: leitura direta por id, para o formulário de edição. */
export function useProjectById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.porId(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
    queryFn: async (): Promise<Project | null> => {
      const snap = await getDoc(doc(db, 'projects', id!))
      return snap.exists() ? docParaProjeto(snap) : null
    },
  })
}
