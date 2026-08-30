import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { converterLista, docParaSecao } from '@/lib/converters'
import { queryKeys } from '@/lib/queryKeys'
import type { Section } from '@/lib/schemas'

async function buscarSecoesPublicas(): Promise<Section[]> {
  // O `where` não é só um filtro de conveniência: as regras do Firestore
  // recusam a listagem inteira se a consulta não restringir a visible == true.
  const snap = await getDocs(
    query(collection(db, 'sections'), where('visible', '==', true), orderBy('order', 'asc')),
  )
  return converterLista(snap.docs, docParaSecao, 'sections')
}

async function buscarTodasAsSecoes(): Promise<Section[]> {
  const snap = await getDocs(query(collection(db, 'sections'), orderBy('order', 'asc')))
  return converterLista(snap.docs, docParaSecao, 'sections')
}

/** Site público: apenas seções visíveis. */
export function useSections() {
  return useQuery({
    queryKey: queryKeys.sections.publicas(),
    queryFn: buscarSecoesPublicas,
  })
}

/** Painel admin: todas as seções, inclusive as ocultas. */
export function useSectionsAdmin() {
  return useQuery({
    queryKey: queryKeys.sections.admin(),
    queryFn: buscarTodasAsSecoes,
    staleTime: 30 * 1000,
  })
}
