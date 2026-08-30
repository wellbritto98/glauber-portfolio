# `src/hooks/` — Acesso a dados e estado

## Objetivo

Ser a única camada que fala com o Firestore, mais os dois hooks de estado de
interface do site público.

## Responsabilidade principal

Traduzir necessidade de tela em consulta/mutação: montar a query, converter o
resultado, definir a política de cache e invalidar o que precisa depois de uma
escrita. Componentes e rotas **não** chamam `getDocs`/`setDoc` diretamente.

## Arquivos

| Hook | Tipo | Papel |
|---|---|---|
| `useProjects.ts` | leitura | `useProjects()` (público) e `useProjectsAdmin()` (inclui rascunhos); exporta `opcoesProjetosPublicados` para o prefetch no hover |
| `useProject.ts` | leitura | `useProject(slug)` deriva projeto + vizinhos do cache; `useProjectById(id)` lê direto, para o formulário |
| `useSections.ts` | leitura | `useSections()` (só visíveis) e `useSectionsAdmin()` (todas) |
| `useSiteSettings.ts` | leitura+escrita | documento único `settings/site` |
| `useProjectMutations.ts` | escrita | criar, atualizar, excluir, reordenar; `novoProjectId()`; `slugEstaEmUso()` |
| `useSectionMutations.ts` | escrita | criar, atualizar, excluir, mover projetos, reordenar; `contarProjetosDaSecao()`; erro `SecaoComProjetos` |
| `useTheme.ts` | estado | tema claro/escuro do site público |
| `useRevelar.ts` | estado | revela elemento ao entrar na viewport |

## Arquivos críticos

**`useProjects.ts`** — `buscarProjetosPublicados()` é a **única** leitura pública
de projetos: `where('status','==','published')` + `orderBy('order')`. Home,
listagem e página de projeto filtram em memória. Um portfólio tem dezenas de
projetos, não milhares; filtrar no cliente custa menos em cota e dispensa índices
compostos por combinação de filtro.

**`useProjectMutations.ts`** —
- `novoProjectId()` gera o id **antes** de o documento existir, porque o caminho
  no Storage é `projects/{id}/...` e precisa existir já na primeira imagem;
- `useDeleteProject` apaga **os arquivos primeiro**, o documento depois: arquivo
  órfão ninguém vê, documento apontando para imagem inexistente aparece quebrado
  no site;
- `useReorderProjects` grava com `writeBatch` (só o que mudou) e faz update
  otimista com rollback em `onError`.

**`useSectionMutations.ts`** — `useDeleteSection` reconta os projetos da seção
antes de apagar e lança `SecaoComProjetos`. **É a única proteção real**: uma
regra do Firestore não consegue consultar outra coleção.

## Dependências

**Internas:** `@/lib/firebase`, `@/lib/converters`, `@/lib/queryKeys`,
`@/lib/schemas`, `@/lib/upload` (só em `useDeleteProject`).

**Externas:** `@tanstack/react-query`, `firebase/firestore`, `react`.

## Módulos relacionados

Consumidos pelas rotas (`src/routes/`) e por componentes de ambos os lados.
`useTheme` e `useRevelar` são exclusivos do site público.

## Fluxos importantes

**Invalidação após escrita**
- projetos → `queryKeys.projects.all`;
- seções → `queryKeys.sections.all` **e** `queryKeys.projects.all` (a listagem de
  projetos mostra o nome da seção);
- configurações → `setQueryData` imediato + invalidação.

**Política de cache**
- padrão global: 5 minutos (`router.tsx`);
- consultas do admin: `staleTime` de 30 segundos;
- prefetch: `opcoesProjetosPublicados` no hover/foco de um `ProjectCard`.

## Observações técnicas e débitos

- `useProject(slug)` devolve `undefined` enquanto a consulta não é bem-sucedida e
  `{ projeto: null, ... }` quando o slug não existe — a rota trata os dois casos.
- `buscarSecoesPublicas` **precisa** do `where('visible','==',true)`: sem ele o
  Firestore recusa a listagem inteira, porque a regra exige o filtro.
- `useSiteSettings` devolve os padrões do schema quando `settings/site` ainda não
  existe, para que site e formulário funcionem desde o zero.
- `useRevelar` tem um prazo de segurança de 1200 ms: o estado inicial é
  invisível, então uma falha do `IntersectionObserver` esconderia o conteúdo sem
  dar erro — o pior tipo de bug.
- `useTheme` grava `data-site-theme` no `<html>` (pinta o fundo do documento),
  mas **não** aplica `.dark` lá — quem aplica é o `SiteLayout`, no próprio
  wrapper, para o painel nunca herdar o tema escuro.
