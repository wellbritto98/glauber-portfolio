import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SecaoComProjetos, useDeleteSection, useMoveProjectsToSection } from '@/hooks/useSectionMutations'
import type { Section } from '@/lib/schemas'

export type AlvoExclusao =
  | { tipo: 'confirmar'; secao: Section }
  | { tipo: 'mover'; secao: Section; quantidade: number }
  | null

function pluralProjetos(quantidade: number): string {
  return quantidade === 1 ? '1 projeto' : `${quantidade} projetos`
}

/**
 * Reúne as duas formas de exclusão de uma seção num único componente:
 *  - sem projetos dentro: confirmação simples, num AlertDialog;
 *  - com projetos dentro: mover todos para outra seção antes de excluir,
 *    num Dialog com um seletor de destino.
 * Qual delas fica aberta depende de `alvo.tipo` — os dois primitivos ficam
 * sempre montados para que o fechamento anime normalmente.
 */
export function ExcluirSecaoDialogo({
  alvo,
  secoes,
  onOpenChange,
}: {
  alvo: AlvoExclusao
  secoes: Section[]
  onOpenChange: (aberto: boolean) => void
}) {
  const excluir = useDeleteSection()

  function handleConfirmarExclusaoSimples() {
    if (!alvo || alvo.tipo !== 'confirmar') return
    excluir.mutate(alvo.secao.id, {
      onSuccess: () => {
        toast.success('Seção excluída.')
        onOpenChange(false)
      },
      onError: (erro) => {
        toast.error(
          erro instanceof SecaoComProjetos ? erro.message : 'Não foi possível excluir a seção. Tente de novo.',
        )
      },
    })
  }

  return (
    <>
      <AlertDialog open={alvo?.tipo === 'confirmar'} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir "{alvo?.tipo === 'confirmar' ? alvo.secao.name : ''}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Esta seção não tem nenhum projeto, então nada mais será afetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={excluir.isPending}
              onClick={(evento) => {
                evento.preventDefault()
                handleConfirmarExclusaoSimples()
              }}
            >
              {excluir.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={alvo?.tipo === 'mover'} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {alvo?.tipo === 'mover' && (
            <MoverProjetosConteudo
              key={alvo.secao.id}
              secao={alvo.secao}
              quantidade={alvo.quantidade}
              outrasSecoes={secoes.filter((s) => s.id !== alvo.secao.id)}
              onConcluido={() => onOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function MoverProjetosConteudo({
  secao,
  quantidade,
  outrasSecoes,
  onConcluido,
}: {
  secao: Section
  quantidade: number
  outrasSecoes: Section[]
  onConcluido: () => void
}) {
  const [destino, setDestino] = useState('')
  const [processando, setProcessando] = useState(false)
  const mover = useMoveProjectsToSection()
  const excluir = useDeleteSection()

  async function handleMoverEExcluir() {
    if (!destino) return
    setProcessando(true)
    try {
      const movidos = await mover.mutateAsync({ de: secao.id, para: destino })
      await excluir.mutateAsync(secao.id)
      const nomeDestino = outrasSecoes.find((s) => s.id === destino)?.name ?? 'outra seção'
      toast.success(`${pluralProjetos(movidos)} movido(s) para "${nomeDestino}". Seção "${secao.name}" excluída.`)
      onConcluido()
    } catch (erro) {
      toast.error(
        erro instanceof SecaoComProjetos ? erro.message : 'Não foi possível concluir a operação. Tente de novo.',
      )
    } finally {
      setProcessando(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Mover projetos antes de excluir</DialogTitle>
        <DialogDescription>
          A seção "{secao.name}" ainda tem {pluralProjetos(quantidade)}. Escolha para onde movê-los — a seção é
          excluída assim que os projetos forem movidos.
        </DialogDescription>
      </DialogHeader>

      {outrasSecoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Não há outra seção para receber estes projetos. Crie uma nova seção antes de excluir esta.
        </p>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="destino-secao">Mover projetos para</Label>
          <Select value={destino} onValueChange={setDestino}>
            <SelectTrigger id="destino-secao" className="w-full">
              <SelectValue placeholder="Escolha uma seção" />
            </SelectTrigger>
            <SelectContent>
              {outrasSecoes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onConcluido} disabled={processando}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={!destino || processando || outrasSecoes.length === 0}
          onClick={() => void handleMoverEExcluir()}
        >
          {processando ? 'Movendo...' : 'Mover e excluir'}
        </Button>
      </DialogFooter>
    </>
  )
}
