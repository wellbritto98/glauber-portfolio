import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { converterLista, docParaProjeto } from '@/lib/converters'
import { queryKeys } from '@/lib/queryKeys'
import type { Project } from '@/lib/schemas'

/**
 * Uma única consulta serve a home, a listagem e a página de projeto.
 *
 * Um portfólio tem dezenas de projetos, não milhares: filtrar por seção, tag
 * ou destaque em memória sai mais barato (em cota do Firestore e em índices
 * compostos) do que uma consulta por combinação de filtro.
 */
async function buscarProjetosPublicados(): Promise<Project[]> {
  const snap = await getDocs(
    query(collection(db, 'projects'), where('status', '==', 'published'), orderBy('order', 'asc')),
  )
  return converterLista(snap.docs, docParaProjeto, 'projects')
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.publicados(),
    queryFn: buscarProjetosPublicados,
  })
}

/** Opções para o `prefetchQuery` no hover dos cards. */
export const opcoesProjetosPublicados = {
  queryKey: queryKeys.projects.publicados(),
  queryFn: buscarProjetosPublicados,
  staleTime: 5 * 60 * 1000,
}

async function buscarTodosOsProjetos(): Promise<Project[]> {
  const snap = await getDocs(query(collection(db, 'projects'), orderBy('order', 'asc')))
  return converterLista(snap.docs, docParaProjeto, 'projects')
}

/** Painel admin: todos os projetos, inclusive rascunhos. */
export function useProjectsAdmin() {
  return useQuery({
    queryKey: queryKeys.projects.admin(),
    queryFn: buscarTodosOsProjetos,
    staleTime: 30 * 1000,
  })
}
