import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Layers, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useSectionsAdmin } from '@/hooks/useSections'
import { contarProjetosDaSecao } from '@/hooks/useSectionMutations'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EstadoDeErro } from '@/components/admin/EstadoDeErro'
import { SecoesLista } from '@/components/admin/secoes/SecoesLista'
import { SecaoFormDialog } from '@/components/admin/secoes/SecaoFormDialog'
import { ExcluirSecaoDialogo, type AlvoExclusao } from '@/components/admin/secoes/ExcluirSecaoDialogo'
import type { Section } from '@/lib/schemas'

export const Route = createFileRoute('/admin/secoes')({
  component: AdminSecoes,
})

interface EstadoDialogoForm {
  aberto: boolean
  secao: Section | null
  /** Incrementa a cada abertura para remontar o formulário com valores frescos. */
  chave: number
}

function AdminSecoes() {
  const secoesQuery = useSectionsAdmin()

  const [dialogoForm, setDialogoForm] = useState<EstadoDialogoForm>({
    aberto: false,
    secao: null,
    chave: 0,
  })
  const [alvoExclusao, setAlvoExclusao] = useState<AlvoExclusao>(null)
  const [idVerificando, setIdVerificando] = useState<string | null>(null)

  function abrirNova() {
    setDialogoForm((estado) => ({ aberto: true, secao: null, chave: estado.chave + 1 }))
  }

  function abrirEdicao(secao: Section) {
    setDialogoForm((estado) => ({ aberto: true, secao, chave: estado.chave + 1 }))
  }

  async function iniciarExclusao(secao: Section) {
    setIdVerificando(secao.id)
    try {
      const quantidade = await contarProjetosDaSecao(secao.id)
      setAlvoExclusao(quantidade > 0 ? { tipo: 'mover', secao, quantidade } : { tipo: 'confirmar', secao })
    } catch {
      toast.error('Não foi possível verificar os projetos desta seção. Tente de novo.')
    } finally {
      setIdVerificando(null)
    }
  }

  if (secoesQuery.isError) {
    return (
      <EstadoDeErro
        mensagem="Não foi possível carregar as seções."
        onTentarDeNovo={() => void secoesQuery.refetch()}
      />
    )
  }

  const carregando = secoesQuery.isPending
  const secoes = secoesQuery.data ?? []
  const semSecoes = !carregando && secoes.length === 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Seções</h1>
          <p className="text-sm text-muted-foreground">Organize os grupos de projetos que aparecem no site.</p>
        </div>
        <Button size="sm" onClick={abrirNova}>
          <Plus className="size-4" />
          Nova seção
        </Button>
      </div>

      {carregando && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {semSecoes && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Layers className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma seção ainda. Crie a primeira para organizar seus projetos.
          </p>
          <Button size="sm" onClick={abrirNova}>
            <Plus className="size-4" />
            Nova seção
          </Button>
        </div>
      )}

      {!carregando && !semSecoes && (
        <SecoesLista
          secoes={secoes}
          onEditar={abrirEdicao}
          onExcluir={(secao) => void iniciarExclusao(secao)}
          idVerificandoExclusao={idVerificando}
        />
      )}

      <SecaoFormDialog
        key={dialogoForm.chave}
        open={dialogoForm.aberto}
        secao={dialogoForm.secao}
        proximaOrdem={secoes.length}
        onOpenChange={(aberto) => setDialogoForm((estado) => ({ ...estado, aberto }))}
      />

      <ExcluirSecaoDialogo
        alvo={alvoExclusao}
        secoes={secoes}
        onOpenChange={(aberto) => {
          if (!aberto) setAlvoExclusao(null)
        }}
      />
    </div>
  )
}
