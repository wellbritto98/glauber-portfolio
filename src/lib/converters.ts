import { Timestamp } from 'firebase/firestore'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import {
  projectSchema,
  sectionSchema,
  siteSettingsInputSchema,
  type Project,
  type Section,
  type SiteSettings,
} from './schemas'

/**
 * Camada ÚNICA de conversão Firestore -> aplicação.
 *
 * O `Timestamp` do Firestore vira `Date` exclusivamente aqui. Nenhum componente
 * ou hook deve conhecer o tipo Timestamp — espalhar essa conversão é como
 * fusos horários errados entram num projeto.
 */

export function toDate(valor: unknown): Date | null {
  if (valor instanceof Timestamp) return valor.toDate()
  if (valor instanceof Date) return valor
  return null
}

type Snap = DocumentSnapshot | QueryDocumentSnapshot

export function docParaProjeto(snap: Snap): Project {
  const d = snap.data() ?? {}
  return projectSchema.parse({
    ...d,
    id: snap.id,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  })
}

export function docParaSecao(snap: Snap): Section {
  const d = snap.data() ?? {}
  return sectionSchema.parse({
    ...d,
    id: snap.id,
    createdAt: toDate(d.createdAt),
  })
}

export function docParaConfiguracoes(snap: Snap): SiteSettings {
  return siteSettingsInputSchema.parse(snap.data() ?? {})
}

/**
 * Converte uma lista de documentos, descartando os que estiverem malformados.
 *
 * Um único documento corrompido não pode derrubar a galeria inteira — ele é
 * ignorado com um aviso no console, e o resto da página continua funcionando.
 */
export function converterLista<T>(
  snaps: QueryDocumentSnapshot[],
  converter: (snap: QueryDocumentSnapshot) => T,
  rotulo: string,
): T[] {
  const resultado: T[] = []
  for (const snap of snaps) {
    try {
      resultado.push(converter(snap))
    } catch (erro) {
      console.warn(`[${rotulo}] documento ignorado por formato inválido: ${snap.id}`, erro)
    }
  }
  return resultado
}
