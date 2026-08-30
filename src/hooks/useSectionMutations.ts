import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { queryKeys } from '@/lib/queryKeys'
import { sectionInputSchema, type Section, type SectionInput } from '@/lib/schemas'

function useInvalidarSecoes() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.sections.all })
    // Projetos exibem o nome da seção; a listagem precisa refletir a mudança.
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
  }
}

export function useCreateSection() {
  const invalidar = useInvalidarSecoes()
  return useMutation({
    mutationFn: async (valores: SectionInput) => {
      const dados = sectionInputSchema.parse(valores)
      const ref = await addDoc(collection(db, 'sections'), {
        ...dados,
        createdAt: serverTimestamp(),
      })
      return ref.id
    },
    onSuccess: invalidar,
  })
}

export function useUpdateSection() {
  const invalidar = useInvalidarSecoes()
  return useMutation({
    mutationFn: async ({ id, valores }: { id: string; valores: SectionInput }) => {
      const dados = sectionInputSchema.parse(valores)
      await updateDoc(doc(db, 'sections', id), dados)
      return id
    },
    onSuccess: invalidar,
  })
}

/** Quantos projetos apontam para esta seção. */
export async function contarProjetosDaSecao(sectionId: string): Promise<number> {
  const snap = await getDocs(query(collection(db, 'projects'), where('sectionId', '==', sectionId)))
  return snap.size
}

export class SecaoComProjetos extends Error {
  constructor(public readonly quantidade: number) {
    super(
      `Esta seção ainda tem ${quantidade} ${quantidade === 1 ? 'projeto' : 'projetos'}. ` +
        'Mova os projetos para outra seção antes de excluí-la.',
    )
  }
}

export function useDeleteSection() {
  const invalidar = useInvalidarSecoes()
  return useMutation({
    mutationFn: async (id: string) => {
      // Guarda no cliente. As regras do Firestore não conseguem fazer esta
      // checagem (não dá para consultar outra coleção dentro de uma regra),
      // então a proteção real é esta — e a confirmação na interface.
      const quantidade = await contarProjetosDaSecao(id)
      if (quantidade > 0) throw new SecaoComProjetos(quantidade)
      await deleteDoc(doc(db, 'sections', id))
      return id
    },
    onSuccess: invalidar,
  })
}

/** Move todos os projetos de uma seção para outra. */
export function useMoveProjectsToSection() {
  const invalidar = useInvalidarSecoes()
  return useMutation({
    mutationFn: async ({ de, para }: { de: string; para: string }) => {
      const snap = await getDocs(query(collection(db, 'projects'), where('sectionId', '==', de)))
      const lote = writeBatch(db)
      snap.docs.forEach((d) => lote.update(d.ref, { sectionId: para }))
      await lote.commit()
      return snap.size
    },
    onSuccess: invalidar,
  })
}

export function useReorderSections() {
  const queryClient = useQueryClient()
  const chave = queryKeys.sections.admin()

  return useMutation({
    mutationFn: async (ordenadas: Section[]) => {
      const lote = writeBatch(db)
      ordenadas.forEach((secao, indice) => {
        if (secao.order !== indice) {
          lote.update(doc(db, 'sections', secao.id), { order: indice })
        }
      })
      await lote.commit()
    },
    onMutate: async (ordenadas) => {
      await queryClient.cancelQueries({ queryKey: chave })
      const anterior = queryClient.getQueryData<Section[]>(chave)
      queryClient.setQueryData<Section[]>(
        chave,
        ordenadas.map((s, i) => ({ ...s, order: i })),
      )
      return { anterior }
    },
    onError: (_erro, _vars, contexto) => {
      if (contexto?.anterior) queryClient.setQueryData(chave, contexto.anterior)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sections.all })
    },
  })
}
