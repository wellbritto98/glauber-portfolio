import { useCallback, useEffect, useState } from 'react'

export type Tema = 'light' | 'dark'

const CHAVE_ARMAZENAMENTO = 'tema-site'

function lerTemaInicial(): Tema {
  const salvo = window.localStorage.getItem(CHAVE_ARMAZENAMENTO)
  if (salvo === 'light' || salvo === 'dark') return salvo
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Preferência de tema do site público, independente do painel admin.
 *
 * A classe `.dark` é aplicada pelo `SiteLayout` num wrapper próprio — nunca
 * no `<html>` — para não vazar para os componentes shadcn do admin. Aqui só
 * cuidamos do estado e da gravação do atributo que pinta o fundo do
 * documento (ver `app.css`, `html[data-site-theme]`).
 */
export function useTheme() {
  const [tema, setTema] = useState<Tema>(lerTemaInicial)

  useEffect(() => {
    document.documentElement.dataset.siteTheme = tema
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, tema)
  }, [tema])

  const alternar = useCallback(() => {
    setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))
  }, [])

  return { tema, alternar }
}
