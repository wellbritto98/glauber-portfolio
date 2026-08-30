import imageCompression from 'browser-image-compression'
import { ensureStorage } from './storage'
import type { StoredImage } from './schemas'

/** Teto do arquivo ORIGINAL, antes de qualquer compressão. */
export const LIMITE_BYTES = 10 * 1024 * 1024
export const LIMITE_LEGIVEL = '10 MB'

/** Maior lado da imagem principal e da miniatura, em pixels. */
const LADO_MAXIMO = 2400
const LADO_MINIATURA = 600
const QUALIDADE = 0.85

export class ErroDeUpload extends Error {}
export class UploadCancelado extends Error {
  constructor() {
    super('Envio cancelado.')
  }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

let cacheWebp: boolean | null = null

/** Detecta suporte a WebP uma única vez por sessão. */
function suportaWebp(): boolean {
  if (cacheWebp !== null) return cacheWebp
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    cacheWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    cacheWebp = false
  }
  return cacheWebp
}

async function dimensoesDe(blob: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(blob)
  const dims = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dims
}

function formatarTamanho(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

/**
 * Valida o arquivo antes de qualquer processamento.
 * Retorna a mensagem de erro em português, ou null se estiver tudo certo.
 */
export function validarArquivo(arquivo: File): string | null {
  if (!arquivo.type.startsWith('image/')) {
    return `"${arquivo.name}" não é uma imagem. Envie um arquivo JPG, PNG, WebP ou HEIC.`
  }
  if (arquivo.size > LIMITE_BYTES) {
    return (
      `"${arquivo.name}" tem ${formatarTamanho(arquivo.size)} e o limite é ${LIMITE_LEGIVEL}. ` +
      'Exporte a imagem em um tamanho menor e tente de novo.'
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// Compressão
// ---------------------------------------------------------------------------

async function comprimir(arquivo: File, ladoMaximo: number): Promise<Blob> {
  const webp = suportaWebp()
  return imageCompression(arquivo, {
    maxWidthOrHeight: ladoMaximo,
    initialQuality: QUALIDADE,
    useWebWorker: true,
    // maxSizeMB alto de propósito: quem manda no resultado é a dimensão e a
    // qualidade, não um alvo de peso que degradaria a imagem do designer.
    maxSizeMB: 12,
    fileType: webp ? 'image/webp' : 'image/jpeg',
  })
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

export interface ControleDeUpload {
  promessa: Promise<StoredImage>
  cancelar: () => void
}

export interface OpcoesDeUpload {
  arquivo: File
  /** Pasta no Storage, sem barra final. Ex.: `projects/abc123` ou `settings`. */
  pasta: string
  /** Progresso combinado (imagem + miniatura), de 0 a 100. */
  onProgresso?: (porcentagem: number) => void
  /** Texto alternativo inicial. O admin pode editar depois. */
  alt?: string
}

/**
 * Comprime, gera miniatura e envia ao Storage.
 *
 * Retorna a promessa do resultado junto de um `cancelar()`, porque o designer
 * precisa poder abortar um envio grande sem recarregar a página.
 */
export function enviarImagem(opcoes: OpcoesDeUpload): ControleDeUpload {
  const { arquivo, pasta, onProgresso, alt = '' } = opcoes

  let cancelado = false
  let tarefaAtual: { cancel: () => boolean } | null = null

  const cancelar = () => {
    cancelado = true
    tarefaAtual?.cancel()
  }

  const promessa = (async (): Promise<StoredImage> => {
    const problema = validarArquivo(arquivo)
    if (problema) throw new ErroDeUpload(problema)

    const { storage, mod } = await ensureStorage()
    if (cancelado) throw new UploadCancelado()

    const extensao = suportaWebp() ? 'webp' : 'jpg'
    const id = crypto.randomUUID()
    const caminhoPrincipal = `${pasta}/${id}.${extensao}`
    const caminhoMiniatura = `${pasta}/${id}-thumb.${extensao}`

    // A compressão roda antes do upload e não tem progresso próprio;
    // reservamos os primeiros 10% da barra para ela.
    onProgresso?.(2)
    const [principal, miniatura] = await Promise.all([
      comprimir(arquivo, LADO_MAXIMO),
      comprimir(arquivo, LADO_MINIATURA),
    ])
    if (cancelado) throw new UploadCancelado()
    onProgresso?.(10)

    const { width, height } = await dimensoesDe(principal)

    const enviar = (caminho: string, blob: Blob, faixa: [number, number]) =>
      new Promise<string>((resolve, reject) => {
        const tarefa = mod.uploadBytesResumable(mod.ref(storage, caminho), blob, {
          contentType: blob.type,
          cacheControl: 'public, max-age=31536000, immutable',
        })
        tarefaAtual = tarefa
        tarefa.on(
          'state_changed',
          (snap) => {
            const fracao = snap.totalBytes > 0 ? snap.bytesTransferred / snap.totalBytes : 0
            const [inicio, fim] = faixa
            onProgresso?.(Math.round(inicio + fracao * (fim - inicio)))
          },
          (erro) => {
            if (erro.code === 'storage/canceled') reject(new UploadCancelado())
            else reject(new ErroDeUpload(mensagemDeErroDeStorage(erro.code)))
          },
          () => {
            mod.getDownloadURL(tarefa.snapshot.ref).then(resolve, reject)
          },
        )
      })

    // A miniatura é pequena e vai primeiro (10% -> 25%);
    // a imagem principal ocupa o resto da barra (25% -> 100%).
    const thumbUrl = await enviar(caminhoMiniatura, miniatura, [10, 25])
    if (cancelado) throw new UploadCancelado()
    const url = await enviar(caminhoPrincipal, principal, [25, 100])

    return {
      url,
      path: caminhoPrincipal,
      thumbUrl,
      thumbPath: caminhoMiniatura,
      width,
      height,
      alt,
    }
  })()

  return { promessa, cancelar }
}

export function mensagemDeErroDeStorage(codigo: string): string {
  switch (codigo) {
    case 'storage/unauthorized':
      return 'Você não tem permissão para enviar imagens. Entre novamente no painel.'
    case 'storage/quota-exceeded':
      return 'O espaço de armazenamento acabou. Avise quem cuida do site.'
    case 'storage/retry-limit-exceeded':
      return 'O envio demorou demais. Verifique sua conexão e tente de novo.'
    case 'storage/canceled':
      return 'Envio cancelado.'
    default:
      return 'Não foi possível enviar a imagem. Tente de novo em instantes.'
  }
}

// ---------------------------------------------------------------------------
// Exclusão
// ---------------------------------------------------------------------------

/**
 * Apaga um arquivo do Storage pelo `path`.
 * Arquivo já ausente não é erro — o objetivo (não existir) foi atingido.
 */
export async function apagarArquivo(caminho: string | undefined | null): Promise<void> {
  if (!caminho) return
  const { storage, mod } = await ensureStorage()
  try {
    await mod.deleteObject(mod.ref(storage, caminho))
  } catch (erro) {
    const codigo = (erro as { code?: string }).code
    if (codigo === 'storage/object-not-found') return
    throw erro
  }
}

/** Apaga a imagem principal e a miniatura de uma imagem armazenada. */
export async function apagarImagem(
  imagem: { path?: string | null; thumbPath?: string | null } | null | undefined,
): Promise<void> {
  if (!imagem) return
  await Promise.all([apagarArquivo(imagem.path), apagarArquivo(imagem.thumbPath)])
}
