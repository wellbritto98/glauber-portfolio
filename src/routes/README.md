# `src/routes/` — Rotas

## Objetivo

Definir todas as telas da aplicação. Um arquivo por rota, no padrão de
roteamento por arquivo do TanStack Router; o route tree (`src/routeTree.gen.ts`)
é **gerado** pelo `@tanstack/router-plugin` a cada `dev`/`build`.

## Responsabilidade principal

Decidir *o que* mostrar, validar parâmetros de busca e controlar acesso. Rotas
consomem hooks — nunca montam consulta ao Firestore.

## Mapa de rotas

| Arquivo | Caminho | Acesso |
|---|---|---|
| `__root.tsx` | raiz | define `RouterContext` (`{ queryClient }`) e renderiza `<Outlet/>` |
| `index.tsx` | `/` | público |
| `projetos.index.tsx` | `/projetos` | público |
| `projetos.$slug.tsx` | `/projetos/:slug` | público |
| `sobre.tsx` | `/sobre` | público |
| `$.tsx` | curinga (404) | público |
| `admin_.login.tsx` | `/admin/login` | público, **fora** do layout do admin |
| `admin.route.tsx` | `/admin` (layout) | **guard** + sidebar + `Toaster` |
| `admin.index.tsx` | `/admin` | protegido |
| `admin.projetos.index.tsx` | `/admin/projetos` | protegido |
| `admin.projetos.novo.tsx` | `/admin/projetos/novo` | protegido |
| `admin.projetos.$id.tsx` | `/admin/projetos/:id` | protegido |
| `admin.secoes.tsx` | `/admin/secoes` | protegido |
| `admin.configuracoes.tsx` | `/admin/configuracoes` | protegido |

## Arquivos críticos

**`admin.route.tsx`** — o `beforeLoad` chama `getCurrentUser()`, que carrega o
SDK de auth sob demanda e espera `authStateReady()`. Sem usuário, redireciona
para `/admin/login?redirect=<href>`. `isRedirect(erro)` é reerguido no `catch`:
só falhas reais de autenticação viram redirecionamento por exceção. O layout
aplica `className="light"` — o painel é sempre claro.

**`admin_.login.tsx`** — o sufixo `_` faz a rota ter o caminho `/admin/login`
**sem herdar** o layout de `admin.route.tsx`. Se herdasse, o guard redirecionaria
para o login, que dispararia o guard de novo: laço infinito. Traduz os códigos do
Firebase com `mensagemDeErroDeLogin`.

**`projetos.$slug.tsx`** — `useProject(slug)` deriva o projeto e os vizinhos da
lista já em cache; `useSections()` resolve o nome da seção para o breadcrumb e
para a ficha técnica, e a página renderiza sem esse trecho se a consulta falhar
ou a seção estiver oculta. Ordena a galeria por `order`, reaproveita
`obterClasseSpan` para o ritmo da grade, monta as tags `og:` da rota e controla o
índice do `Lightbox`.

**`admin.projetos.novo.tsx`** — gera `novoProjectId()` **uma única vez**
(`useState(() => ...)`). Um id novo a cada render romperia o vínculo com imagens
já enviadas para `projects/{id}/`.

## Validação de parâmetros de busca

Sempre com Zod, no `validateSearch` da rota:

- `/projetos` → `{ secao?: string }`;
- `/admin/projetos` → `{ busca?, secao?, status?: 'draft'|'published'|'todos' }`
  (os filtros vivem na URL, o modo lista/reordenar vive em estado local);
- `/admin/login` → `{ redirect?: string }`.

## Dependências

**Internas:** `@/hooks/*`, `@/components/site/*` (rotas públicas),
`@/components/admin/*` e `@/components/ui/*` (rotas do admin), `@/lib/auth`,
`@/lib/schemas`, `@/lib/utils`.

**Externas:** `@tanstack/react-router`, `@tanstack/react-form` (configurações),
`zod`, `lucide-react`, `sonner`, `firebase/app` (só o tipo `FirebaseError`).

## Fluxos importantes

**Filtro por seção no site:** o link carrega `search={{ secao: slug }}`; a rota
resolve o slug para o `id` da seção e filtra os projetos em memória.

**Metadados:** cada rota pública declara `<title>` e `<meta>` diretamente no JSX
(recurso nativo do React 19). Robôs de rede social não executam JavaScript e não
os enxergam — ver a limitação de Open Graph em
[docs/OBJETIVO.md §7](../../docs/OBJETIVO.md#7-contexto-operacional).

## Observações técnicas e débitos

- Cada rota pública trata `isPending`, `isError` e vazio separadamente. É
  verboso de propósito: o esqueleto de carregamento imita o layout final.
- A home tem três consultas independentes (`settings`, `projects`, `sections`),
  cada uma com seu próprio estado — uma falha isolada não derruba a página.
- **`index.tsx` traz `<title>` e `description` fixos**, ignorando
  `settings.seo.*` preenchido no painel. Ver
  [ARQUITETURA.md §8.2](../../docs/ARQUITETURA.md#82-campos-gravados-que-o-site-nunca-lê).
- Nenhuma rota pública exibe `project.tags`, embora o painel deixe editá-las.
- `admin.configuracoes.tsx` tem ~390 linhas e concentra as quatro abas de
  configuração; é o maior arquivo de rota e o candidato natural a quebra em
  componentes quando ganhar mais campos.
