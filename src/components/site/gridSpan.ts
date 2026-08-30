/**
 * Ritmo assimétrico da grade de projetos: a cada 6 itens, o primeiro e o
 * quarto ocupam 2 colunas a partir do breakpoint `sm`. Combinado com a
 * proporção natural de cada imagem (sem recorte forçado), evita a grade
 * genérica e uniforme de cards.
 */
export function obterClasseSpan(indice: number): string {
  const resto = indice % 6
  return resto === 0 || resto === 3 ? 'sm:col-span-2' : ''
}
