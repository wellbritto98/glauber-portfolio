import { useEffect, useRef, useState } from 'react'

/** Se o observador não disparar neste prazo, revela mesmo assim. */
const PRAZO_DE_SEGURANCA_MS = 1200

/**
 * Revela um elemento quando ele entra na viewport, uma única vez.
 *
 * Substitui o `whileInView` do motion: mesmo efeito, com um
 * IntersectionObserver de algumas linhas, sem carregar 119 kB de biblioteca
 * de animação no bundle do visitante.
 *
 * O estado inicial é invisível, então uma falha do observador esconderia o
 * conteúdo — o pior tipo de bug, porque não dá erro, só some. Por isso existe
 * o prazo de segurança: aba em segundo plano, navegador exótico ou ambiente
 * que não pinta a tela revelam o conteúdo de qualquer forma.
 */
export function useRevelar<T extends HTMLElement>(margem = '-60px') {
  const ref = useRef<T | null>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisivel(true)
      return
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { rootMargin: margem },
    )
    observador.observe(elemento)

    const rede = window.setTimeout(() => {
      setVisivel(true)
      observador.disconnect()
    }, PRAZO_DE_SEGURANCA_MS)

    return () => {
      window.clearTimeout(rede)
      observador.disconnect()
    }
  }, [margem])

  return { ref, visivel }
}
