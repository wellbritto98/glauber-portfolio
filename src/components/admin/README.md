# `src/components/admin/` — Componentes do painel

## Objetivo

A interface de trabalho do designer: tabela de projetos, formulários, upload de
imagens, reordenação por arraste e diálogos de exclusão.

## Responsabilidade principal

Montar as telas do `/admin` sobre os primitivos de `@/components/ui`, chamando os
hooks de mutação e traduzindo erro de SDK em mensagem que o designer entende.

## Estrutura

```
admin/
├─ CampoDeImagem.tsx        upload de UMA imagem (capa, perfil, OG)
├─ ProjetosTabela.tsx       TanStack Table: busca, ordenação, paginação (50/pág.)
├─ ProjetosReordenar.tsx    dnd-kit: define `order` dos projetos
├─ ExcluirProjetoDialog.tsx confirmação de exclusão definitiva
├─ MiniaturaProjeto.tsx     thumb da capa, com placeholder
├─ StatusBadge.tsx          'published' → "Publicado" | 'draft' → "Rascunho"
├─ EstadoDeErro.tsx         estado de erro padrão do painel
├─ projeto/
│  ├─ FormularioProjeto.tsx  criação e edição (compartilhado)
│  ├─ GaleriaDoProjeto.tsx   envio múltiplo + reordenação + legenda/alt
│  ├─ CampoDeTags.tsx        Enter ou vírgula adiciona; Backspace remove
│  └─ PreviewProjetoDialog.tsx  conferência antes de publicar
├─ secoes/
│  ├─ SecoesLista.tsx         lista arrastável, com chave de visibilidade
│  ├─ SecaoFormDialog.tsx     criar/editar seção
│  └─ ExcluirSecaoDialogo.tsx exclusão simples OU mover projetos antes
└─ config/
   └─ CampoDeImagemSimples.tsx  adapta CampoDeImagem para `SimpleImage`
```

## Arquivos críticos

**`projeto/FormularioProjeto.tsx`** (~430 linhas) — o coração do painel.
- Compartilhado entre criar e editar; a rota decide os valores iniciais e passa o
  `projectId` já definido.
- Slug segue o título até ser editado à mão (`slugEditadoManualmenteRef`); no
  modo edição já nasce "editado", para não mudar sozinho um endereço publicado.
- Validação assíncrona de slug duplicado com debounce de 400 ms.
- `statusAlvoRef` decide se o submit publica ou salva rascunho.
- `useBlocker` + `enableBeforeUnload` avisam sobre alterações não salvas;
  `salvoComSucessoRef` desarma o aviso depois de salvar.

**`projeto/GaleriaDoProjeto.tsx`** — envio múltiplo **em sequência**, uma barra
por arquivo, com cancelamento individual. Mantém `valorRef` sincronizado por
`useEffect` porque o `valor` do formulário só reflete o item anterior no ciclo
seguinte de render; sem essa ref, o próximo arquivo da fila sobrescreveria o
anterior.

**`CampoDeImagem.tsx`** — arrastar ou clicar, progresso real, cancelamento,
campo de texto alternativo com aviso quando vazio, e remoção que **apaga o
arquivo do Storage de verdade**. Compartilhado entre o formulário de projeto e as
configurações do site.

**`secoes/ExcluirSecaoDialogo.tsx`** — reúne os dois caminhos de exclusão
(`AlvoExclusao` = `'confirmar'` | `'mover'`) em um componente, mantendo os dois
primitivos montados para que o fechamento anime normalmente.

## Dependências

**Internas:** `@/components/ui/*`, `@/hooks/useProjectMutations`,
`@/hooks/useSectionMutations`, `@/hooks/useSections`, `@/lib/upload`,
`@/lib/schemas`, `@/lib/slug`, `@/lib/utils`.

**Externas:** `@tanstack/react-table`, `@tanstack/react-form`, `@dnd-kit/core`,
`@dnd-kit/sortable`, `@dnd-kit/utilities`, `sonner`, `lucide-react`,
`@tanstack/react-router`.

## Módulos relacionados

Consumidos apenas pelas rotas `admin.*`. Nada aqui é importado pelo site público
— e não deve ser.

## Fluxos importantes

**Upload:** `validarArquivo` → `enviarImagem` (comprime, envia miniatura, envia
principal) → `onChange` com o `StoredImage` → o formulário grava no `submit`.
Erros viram toast; `UploadCancelado` vira `toast.info`.

**Reordenação:** `dnd-kit` com `PointerSensor` (ativação a 4 px, para não
disparar em cliques) e `KeyboardSensor` (arraste acessível pelo teclado) →
`arrayMove` → mutação com update otimista.

**Exclusão de projeto:** `ExcluirProjetoDialog` → `useDeleteProject` → arquivos
primeiro, documento depois.

## Observações técnicas e débitos

- **`FormularioProjeto` reimplementa a regra "publicado exige capa"** que já
  existe em `publishableProjectSchema` (`lib/schemas.ts`) — schema que ninguém
  usa. Ao mexer na regra, mexa nos dois lugares ou elimine a duplicidade.
- `ErroDoCampo` (em `FormularioProjeto`) e `Erros` (em `admin.configuracoes.tsx`)
  fazem a mesma normalização de erro do TanStack Form em dois lugares.
- `config/CampoDeImagemSimples` preenche `width: 1, height: 1` de mentirinha para
  reaproveitar `CampoDeImagem`. Funciona porque foto de perfil e imagem OG têm
  tamanho fixo no layout; se algum dia precisarem de `aspect-ratio`, esse atalho
  vira bug.
- Reordenar sempre opera sobre a lista **completa**, nunca sobre o recorte
  filtrado — reordenar um subconjunto deixaria `order` inconsistente com os itens
  ocultos.
- O painel é pensado para telas grandes; funciona no celular, mas publicar um
  projeto com galeria grande é bem mais confortável no computador.
