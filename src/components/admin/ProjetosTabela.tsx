import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, FolderKanban, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MiniaturaProjeto } from '@/components/admin/MiniaturaProjeto'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { Project, Section } from '@/lib/schemas'

const TAMANHO_PAGINA = 50

export function ProjetosTabela({
  projetos,
  secoesPorId,
  onExcluir,
}: {
  projetos: Project[]
  secoesPorId: Map<string, Section>
  onExcluir: (projeto: Project) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        id: 'capa',
        header: 'Capa',
        cell: ({ row }) => <MiniaturaProjeto projeto={row.original} />,
        enableSorting: false,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <BotaoOrdenar rotulo="Título" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
        ),
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.title}</span>,
      },
      {
        id: 'secao',
        accessorFn: (row) => secoesPorId.get(row.sectionId)?.name ?? 'Sem seção',
        header: 'Seção',
      },
      {
        accessorKey: 'year',
        header: ({ column }) => (
          <BotaoOrdenar rotulo="Ano" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'acoes',
        header: '',
        enableSorting: false,
        cell: ({ row }) => <AcoesLinha projeto={row.original} onExcluir={onExcluir} />,
      },
    ],
    [secoesPorId, onExcluir],
  )

  const table = useReactTable({
    data: projetos,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: TAMANHO_PAGINA } },
  })

  const linhas = table.getRowModel().rows
  const mostrarPaginacao = projetos.length > TAMANHO_PAGINA

  if (projetos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
        <FolderKanban className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum projeto encontrado com esses filtros.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {linhas.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {mostrarPaginacao && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function BotaoOrdenar({ rotulo, onClick }: { rotulo: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-left font-medium hover:text-foreground"
    >
      {rotulo}
      <ArrowUpDown className="size-3.5 text-muted-foreground" />
    </button>
  )
}

function AcoesLinha({ projeto, onExcluir }: { projeto: Project; onExcluir: (projeto: Project) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ações para "${projeto.title}"`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/admin/projetos/$id" params={{ id: projeto.id }}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/projetos/$slug" params={{ slug: projeto.slug }} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            Ver no site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => onExcluir(projeto)}>
          <Trash2 className="size-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
