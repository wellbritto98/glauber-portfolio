import { useCallback, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Trash2, TriangleAlert, X } from 'lucide-react'
import {
  ErroDeUpload,
  UploadCancelado,
  apagarImagem,
  enviarImagem,
  validarArquivo,
} from '@/lib/upload'
import type { StoredImage } from '@/lib/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface CampoDeImagemProps {
  valor: StoredImage | null
  onChange: (imagem: StoredImage | null) => void
  /** Pasta no Storage, sem barra final. Ex.: `projects/abc123` ou `settings`. */
  pasta: string
  rotulo: string
  descricao?: string
  /** Mostra o campo de texto alternativo com aviso quando estiver vazio. */
  comTextoAlternativo?: boolean
}

/**
 * Campo de upload de uma imagem: arrastar ou clicar, barra de progresso real,
 * cancelamento, texto alternativo e remoção (que apaga o arquivo do Storage).
 *
 * Componente compartilhado entre o formulário de projeto e as configurações
 * do site — os dois precisam exatamente deste comportamento.
 */
export function CampoDeImagem({
  valor,
  onChange,
  pasta,
  rotulo,
  descricao,
  comTextoAlternativo = true,
}: CampoDeImagemProps) {
  const idCampo = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelarRef = useRef<(() => void) | null>(null)

  const [progresso, setProgresso] = useState<number | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [removendo, setRemovendo] = useState(false)

  const enviando = progresso !== null

  const enviar = useCallback(
    async (arquivo: File) => {
      const problema = validarArquivo(arquivo)
      if (problema) {
        toast.error(problema)
        return
      }

      setProgresso(0)
      const controle = enviarImagem({ arquivo, pasta, onProgresso: setProgresso })
      cancelarRef.current = controle.cancelar

      try {
        const imagem = await controle.promessa
        onChange(imagem)
        toast.success('Imagem enviada.')
      } catch (erro) {
        if (erro instanceof UploadCancelado) toast.info('Envio cancelado.')
        else if (erro instanceof ErroDeUpload) toast.error(erro.message)
        else toast.error('Não foi possível enviar a imagem. Tente de novo.')
      } finally {
        setProgresso(null)
        cancelarRef.current = null
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [pasta, onChange],
  )

  async function remover() {
    if (!valor) return
    setRemovendo(true)
    try {
      await apagarImagem(valor)
      onChange(null)
      toast.success('Imagem removida.')
    } catch {
      toast.error('Não foi possível remover a imagem. Tente de novo.')
    } finally {
      setRemovendo(false)
    }
  }

  const altVazio = comTextoAlternativo && valor !== null && valor.alt.trim() === ''

  return (
    <div className="space-y-2">
      <Label htmlFor={idCampo}>{rotulo}</Label>
      {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}

      {valor ? (
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-start gap-3">
            <img
              src={valor.thumbUrl ?? valor.url}
              alt={valor.alt || 'Pré-visualização'}
              width={valor.width}
              height={valor.height}
              loading="lazy"
              decoding="async"
              className="h-24 w-24 shrink-0 rounded object-cover"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                {valor.width} × {valor.height} pixels
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={remover}
                disabled={removendo}
              >
                {removendo ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Remover imagem
              </Button>
            </div>
          </div>

          {comTextoAlternativo && (
            <div className="space-y-1">
              <Label htmlFor={`${idCampo}-alt`} className="text-xs">
                Texto alternativo
              </Label>
              <Input
                id={`${idCampo}-alt`}
                value={valor.alt}
                placeholder="Descreva a imagem para quem não pode vê-la"
                onChange={(e) => onChange({ ...valor, alt: e.target.value })}
                aria-describedby={altVazio ? `${idCampo}-alt-aviso` : undefined}
              />
              {altVazio && (
                <p
                  id={`${idCampo}-alt-aviso`}
                  className="flex items-center gap-1.5 text-xs text-amber-700"
                >
                  <TriangleAlert className="size-3.5 shrink-0" />
                  Sem texto alternativo, leitores de tela não conseguem descrever esta
                  imagem.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setArrastando(true)
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault()
            setArrastando(false)
            const arquivo = e.dataTransfer.files[0]
            if (arquivo) void enviar(arquivo)
          }}
          className={cn(
            'rounded-md border border-dashed p-6 text-center transition-colors',
            arrastando && 'border-primary bg-accent',
          )}
        >
          {enviando ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Enviando… {progresso}%</p>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={progresso}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do envio"
              >
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cancelarRef.current?.()}
              >
                <X className="size-4" />
                Cancelar envio
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <ImagePlus className="mx-auto size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Arraste uma imagem aqui ou{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2"
                  onClick={() => inputRef.current?.click()}
                >
                  escolha um arquivo
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou WebP, até 10 MB. A imagem é comprimida automaticamente.
              </p>
            </div>
          )}
          <input
            id={idCampo}
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const arquivo = e.target.files?.[0]
              if (arquivo) void enviar(arquivo)
            }}
          />
        </div>
      )}
    </div>
  )
}
