/**
 * Gera um slug a partir de um título em português.
 * "Identidade Visual — Café Açaí" -> "identidade-visual-cafe-acai"
 */
export function gerarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    // Remove os acentos que o NFD separou das letras (marcas combinantes).
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
