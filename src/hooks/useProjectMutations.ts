import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { queryKeys } from '@/lib/queryKeys'
import { apagarImagem } from '@/lib/upload'
import { projectInputSchema, type Project, type ProjectInput } from '@/lib/schemas'

/**
 * Gera o id do projeto ANTES de ele existir no Firestore.
 *
 * O caminho do Storage é `projects/{projectId}/...`, então o id precisa
 * existir já na primeira imagem enviada — senão os arquivos nasceriam num
 * caminho provisório e teriam de ser movidos depois.
 */
export function novoProjectId(): string {
  return doc(collection(db, 'projects')).id
}

/** Confere se o slug já está em uso por OUTRO projeto. */
export async function slugEstaEmUso(slug: string, ignorarId?: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, 'projects'), where('slug', '==', slug)))
  return snap.docs.some((d) => d.id !== ignorarId)
}

function useInvalidarProjetos() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
  }
}

export function useCreateProject() {
  const invalidar = useInvalidarProjetos()
  return useMutation({
    mutationFn: async ({ id, valores }: { id: string; valores: ProjectInput }) => {
      const dados = projectInputSchema.parse(valores)
      await setDoc(doc(db, 'projects', id), {
        ...dados,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return id
    },
    onSuccess: invalidar,
  })
}

export function useUpdateProject() {
  const invalidar = useInvalidarProjetos()
  return useMutation({
    mutationFn: async ({ id, valores }: { id: string; valores: ProjectInput }) => {
      const dados = projectInputSchema.parse(valores)
      await updateDoc(doc(db, 'projects', id), { ...dados, updatedAt: serverTimestamp() })
      return id
    },
    onSuccess: invalidar,
  })
}

export function useDeleteProject() {
  const invalidar = useInvalidarProjetos()
  return useMutation({
    mutationFn: async (projeto: Project) => {
      // Os arquivos saem primeiro. Se a exclusão do documento falhasse depois
      // de já ter apagado as imagens, o projeto ficaria quebrado mas visível —
      // pior do que arquivos órfãos, que ninguém vê e não custam quase nada.
      await Promise.all([
        apagarImagem(projeto.coverImage),
        ...projeto.gallery.map((img) => apagarImagem(img)),
      ])
      await deleteDoc(doc(db, 'projects', projeto.id))
      return projeto.id
    },
    onSuccess: invalidar,
  })
}

/**
 * Reordenação por arrastar, com update otimista.
 * O item precisa se mover na hora; o round-trip acontece por baixo.
 */
export function useReorderProjects() {
  const queryClient = useQueryClient()
  const chave = queryKeys.projects.admin()

  return useMutation({
    mutationFn: async (ordenados: Project[]) => {
      const lote = writeBatch(db)
      ordenados.forEach((projeto, indice) => {
        if (projeto.order !== indice) {
          lote.update(doc(db, 'projects', projeto.id), { order: indice })
        }
      })
      await lote.commit()
    },
    onMutate: async (ordenados) => {
      await queryClient.cancelQueries({ queryKey: chave })
      const anterior = queryClient.getQueryData<Project[]>(chave)
      queryClient.setQueryData<Project[]>(
        chave,
        ordenados.map((p, i) => ({ ...p, order: i })),
      )
      return { anterior }
    },
    onError: (_erro, _vars, contexto) => {
      // Rollback: devolve exatamente a lista que estava em cache antes.
      if (contexto?.anterior) queryClient.setQueryData(chave, contexto.anterior)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}
