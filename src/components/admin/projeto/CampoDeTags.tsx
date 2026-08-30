import { useId, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Label } from '@/components/ui/label'

export interface CampoDeTagsProps {
  valor: string[]
  onChange: (tags: string[]) => void
  rotulo?: string
}

/**
 * Entrada de múltiplos valores: digitar e pressionar Enter ou vírgula
 * adiciona uma tag; Backspace num campo vazio remove a última.
 */
export function CampoDeTags({ valor, onChange, rotulo = 'Tags' }: CampoDeTagsProps) {
  const idCampo = useId()
  const [texto, setTexto] = useState('')

  function adicionar(bruto: string) {
    const tag = bruto.trim()
    setTexto('')
    if (!tag || valor.includes(tag)) return
    onChange([...valor, tag])
  }

  function remover(indice: number) {
    onChange(valor.filter((_, i) => i !== indice))
  }

  function handleKeyDown(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter' || evento.key === ',') {
      evento.preventDefault()
      adicionar(texto)
    } else if (evento.key === 'Backspace' && texto === '' && valor.length > 0) {
      remover(valor.length - 1)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={idCampo}>{rotulo}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {valor.map((tag, indice) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => remover(indice)}
              aria-label={`Remover tag "${tag}"`}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={idCampo}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => adicionar(texto)}
          placeholder={valor.length === 0 ? 'Digite e pressione Enter' : ''}
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Pressione Enter ou vírgula para adicionar uma tag.</p>
    </div>
  )
}
