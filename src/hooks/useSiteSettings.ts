import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { docParaConfiguracoes } from '@/lib/converters'
import { queryKeys } from '@/lib/queryKeys'
import { siteSettingsInputSchema, type SiteSettingsInput } from '@/lib/schemas'

const REF = () => doc(db, 'settings', 'site')

export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.settings.site(),
    queryFn: async (): Promise<SiteSettingsInput> => {
      const snap = await getDoc(REF())
      // Documento ainda não criado: devolve os padrões do schema em vez de
      // null, para que o site e o formulário do admin funcionem desde o zero.
      if (!snap.exists()) return siteSettingsInputSchema.parse({})
      return docParaConfiguracoes(snap)
    },
  })
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: SiteSettingsInput) => {
      const dados = siteSettingsInputSchema.parse(valores)
      await setDoc(REF(), dados, { merge: true })
      return dados
    },
    onSuccess: (dados) => {
      queryClient.setQueryData(queryKeys.settings.site(), dados)
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })
}
