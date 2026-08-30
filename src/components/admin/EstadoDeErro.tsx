import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Estado de erro padrão do painel. Nunca mostramos tela branca: toda consulta
 * que falha cai aqui, com uma mensagem em português e um jeito de tentar de novo.
 */
export function EstadoDeErro({
  mensagem = 'Não foi possível carregar os dados.',
  onTentarDeNovo,
}: {
  mensagem?: string
  onTentarDeNovo: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{mensagem}</p>
      <Button variant="outline" size="sm" onClick={onTentarDeNovo}>
        Tentar de novo
      </Button>
    </div>
  )
}
