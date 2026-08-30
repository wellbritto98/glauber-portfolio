import { CampoDeImagem } from '@/components/admin/CampoDeImagem'
import type { SimpleImage, StoredImage } from '@/lib/schemas'

/**
 * Adapta o CampoDeImagem (que trabalha com StoredImage) para os campos de
 * configuração, que guardam apenas { url, path }.
 *
 * As dimensões não são persistidas aqui porque o site não reserva espaço para
 * essas imagens do jeito que faz na galeria — a foto de perfil e a imagem de
 * compartilhamento têm tamanho fixo no layout.
 */
export function CampoDeImagemSimples({
  valor,
  onChange,
  rotulo,
  descricao,
}: {
  valor: SimpleImage | null
  onChange: (imagem: SimpleImage | null) => void
  rotulo: string
  descricao?: string
}) {
  const comoStored: StoredImage | null = valor
    ? { ...valor, width: 1, height: 1, alt: '' }
    : null

  return (
    <CampoDeImagem
      valor={comoStored}
      onChange={(img) => onChange(img ? { url: img.url, path: img.path } : null)}
      pasta="settings"
      rotulo={rotulo}
      descricao={descricao}
      comTextoAlternativo={false}
    />
  )
}
