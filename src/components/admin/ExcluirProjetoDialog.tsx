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
import { useDeleteProject } from '@/hooks/useProjectMutations'
import type { Project } from '@/lib/schemas'

/**
 * Confirmação de exclusão. `projeto` é nulo quando o diálogo está fechado —
 * mantém o título e a descrição estáveis até a animação de fechamento terminar.
 */
export function ExcluirProjetoDialog({
  projeto,
  onOpenChange,
}: {
  projeto: Project | null
  onOpenChange: (aberto: boolean) => void
}) {
  const excluir = useDeleteProject()

  function handleConfirmar() {
    if (!projeto) return
    excluir.mutate(projeto, {
      onSuccess: () => {
        toast.success('Projeto excluído.')
        onOpenChange(false)
      },
      onError: () => {
        toast.error('Não foi possível excluir o projeto. Tente de novo.')
      },
    })
  }

  return (
    <AlertDialog open={projeto !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir "{projeto?.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. O projeto e todas as suas imagens no armazenamento
            serão apagados permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={excluir.isPending}
            onClick={(evento) => {
              evento.preventDefault()
              handleConfirmar()
            }}
          >
            {excluir.isPending ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
