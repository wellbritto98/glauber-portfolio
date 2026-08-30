# Arquitetura do Sistema

> Documento oficial de arquitetura. Base para desenvolvimento em Spec Driven
> Development (skill `tlc-spec-driven`). Tudo aqui foi derivado do código real:
> imports, chamadas, configuração e regras de segurança deste repositório.
> Onde houve inferência, está marcado como **Hipótese**.
>
> Documentos irmãos: [Objetivo do Sistema](OBJETIVO.md) · [CLAUDE.md](../CLAUDE.md) ·
> READMEs por módulo em `src/*/README.md`.

---

## 1. Visão arquitetural

Aplicação **SPA client-only**. Não existe backend próprio, nem função serverless,
nem camada de API. O navegador fala direto com o Firebase, e a autorização é
inteiramente delegada às regras do Firestore e do Storage.

```
┌────────────────────────────────────────────────────────────────┐
│  Navegador (bundle único servido pelo Firebase Hosting)        │
│                                                                │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Site público    │         │  Painel /admin   │             │
│  │  Tailwind à mão  │         │  shadcn/ui       │             │
│  │  tema claro/esc. │         │  sempre claro    │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
│           │                            │                       │
│           └────────── hooks/ ──────────┘   (TanStack Query)     │
│                          │                                      │
│                       lib/  (schemas Zod, converters, keys)     │
│                          │                                      │
│        ┌─────────────────┼────────────────────┐                 │
│        │                 │                    │                 │
│   firebase.ts       auth.ts (dyn)      storage.ts (dyn)         │
│   Firestore         Authentication     Cloud Storage            │
└────────┼─────────────────┼────────────────────┼────────────────┘
         │                 │                    │
   ┌─────▼─────┐     ┌─────▼─────┐        ┌─────▼─────┐
   │ Firestore │     │   Auth    │        │  Storage  │
   │  regras   │     │ 1 usuário │        │  regras   │
   └───────────┘     └───────────┘        └───────────┘
```

**Duas aplicações no mesmo bundle**, separadas por rota e por sistema de design:

| | Site público | Painel `/admin` |
|---|---|---|
| Rotas | `/`, `/projetos`, `/projetos/$slug`, `/sobre`, `/$` | `/admin/*`, `/admin/login` |
| Estilo | Tailwind escrito à mão, tokens `paper/ink/rule/brand` | shadcn/ui + Radix, tokens `background/foreground/...` |
| Tema | claro e escuro | **sempre claro** (`className="light"` em `admin.route.tsx:71` e `admin_.login.tsx:52`) |
| SDK Firebase | apenas Firestore (estático) | Firestore + Auth + Storage (dinâmicos) |
| Acesso | anônimo | UID único autenticado |

---

## 2. Padrões utilizados

### 2.1 Schema-first com Zod

`src/lib/schemas.ts` é a **fonte única de verdade dos tipos**. Não existe
`interface` paralela para entidades de domínio — os tipos saem de `z.infer`.
Cada entidade tem dois schemas:

- `xInput` — o que o formulário produz e o que é gravado no Firestore;
- `x` — a entidade lida do Firestore, com `id` e datas já convertidas.

O mesmo schema valida na entrada (formulário), na escrita (`parse` dentro da
mutation) e na leitura (`parse` dentro do converter).

### 2.2 Camada única de conversão

`src/lib/converters.ts` é o **único lugar** que conhece `Timestamp` do Firestore.
`toDate()` converte, `docParaProjeto` / `docParaSecao` / `docParaConfiguracoes`
parseiam, e `converterLista` descarta documentos malformados com um `console.warn`
em vez de derrubar a página inteira.

### 2.3 Chaves de cache centralizadas

`src/lib/queryKeys.ts` concentra todas as query keys. Nenhuma string literal de
chave existe fora desse arquivo — é o que garante que `invalidateQueries` atinja
exatamente o pretendido.

### 2.4 Hooks como camada de acesso a dados

Componentes e rotas nunca chamam `getDocs`/`setDoc` diretamente; consomem hooks
de `src/hooks/`. Leitura via `useQuery`, escrita via `useMutation` com
invalidação no `onSuccess`. Reordenações usam **update otimista com rollback**
(`useReorderProjects`, `useReorderSections`).

### 2.5 Import dinâmico como fronteira de bundle

`firebase/auth` e `firebase/storage` **só** entram por `await import()`
(`lib/auth.ts`, `lib/storage.ts`), cada um por trás de um singleton de promessa
(`ensureAuth`, `ensureStorage`). Motivo estrutural: as definições de rota do
TanStack Router — inclusive `beforeLoad` — ficam na parte crítica do route tree,
que não sofre code splitting; um import estático levaria o SDK de auth para
dentro do JavaScript que todo visitante baixa.

### 2.6 Roteamento por arquivo com code splitting automático

`@tanstack/router-plugin` (declarado **antes** do plugin react em
`vite.config.ts`) gera `src/routeTree.gen.ts` e separa os componentes de rota do
route tree crítico (`autoCodeSplitting: true`). É o que mantém TanStack Table,
TanStack Form, dnd-kit e shadcn fora do bundle público.

### 2.7 Uma consulta alimenta três telas

`buscarProjetosPublicados()` (`hooks/useProjects.ts`) é a única leitura pública
de projetos. Home, listagem e página de projeto filtram **em memória**. Um
portfólio tem dezenas de projetos, não milhares: filtrar no cliente sai mais
barato em cota do Firestore e em índices compostos do que uma consulta por
combinação de filtro.

### 2.8 Nomenclatura em português

Identificadores internos (funções, variáveis, componentes, props) são em
português; nomes de campos persistidos no Firestore são em inglês
(`title`, `slug`, `sectionId`, `coverImage`, `gallery`, `status`, `order`).
A fronteira entre as duas convenções é exatamente `schemas.ts`.

---

## 3. Regras arquiteturais

Regras que o código respeita hoje e que **novas implementações devem manter**.
Violá-las quebra garantias medidas (peso do bundle, isolamento de tema,
segurança) e não apenas o estilo.

1. **`src/components/ui/**` é exclusivo do painel.** Nenhum arquivo em
   `components/site/` ou nas rotas públicas importa de `components/ui`
   (verificado por busca de imports). O site público usa Tailwind escrito à mão;
   quando precisa de um primitivo acessível, usa Radix cru — como o
   `Lightbox.tsx`, que importa `radix-ui` diretamente, sem estilos do shadcn.
2. **Nunca importar `firebase/auth` ou `firebase/storage` estaticamente.** Use
   `ensureAuth()` / `ensureStorage()`.
3. **A classe `.dark` nunca vai no `<html>`.** Ela é aplicada no wrapper do
   `SiteLayout`; o `<html>` recebe apenas `data-site-theme`, que pinta o fundo do
   documento (`app.css`). Se `.dark` subisse para o `<html>`, o painel herdaria
   os utilitários `dark:` do shadcn.
4. **Timestamp só existe dentro de `converters.ts`.**
5. **Toda query key vem de `queryKeys`.**
6. **Rotas do admin ficam sob o layout guardado `admin.route.tsx`**, exceto o
   login, que usa o sufixo `_` (`admin_.login.tsx`) justamente para ter o caminho
   `/admin/login` **sem** herdar o layout — caso contrário o guard redirecionaria
   para o login, que dispararia o guard de novo: laço infinito.
7. **Escrita só acontece autenticada.** As regras negam por padrão; não existe
   nenhuma regra de escrita aberta em `firestore.rules` ou `storage.rules`.
8. **Consultas públicas precisam espelhar a regra.** `buscarSecoesPublicas` inclui
   `where('visible','==',true)` porque o Firestore recusa a listagem inteira se a
   consulta não restringir o filtro que a regra exige. O mesmo vale para
   `where('status','==','published')` em projetos.
9. **Toda consulta tem estado de erro visível.** Nenhuma tela branca: o site usa
   `components/site/Estado.tsx`, o painel usa `components/admin/EstadoDeErro.tsx`.
10. **Ordem de exclusão: arquivos primeiro, documento depois** (`useDeleteProject`).
    Arquivo órfão ninguém vê; documento apontando para imagem inexistente, sim.

---

## 4. Convenções técnicas

| Assunto | Convenção |
|---|---|
| Alias de import | `@/` → `src/` (`tsconfig.json` + `vite.config.ts`) |
| Versões de dependência | **fixadas**, sem `^` — foram verificadas compilando juntas |
| TypeScript | `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `noEmit` |
| Tipos-só | `import type { ... }` obrigatório (`verbatimModuleSyntax`) |
| Mensagens ao usuário | sempre em português, sempre acionáveis; erros de SDK são traduzidos em `mensagemDeErroDeLogin` e `mensagemDeErroDeStorage` |
| Erros de domínio | classes próprias (`ErroDeUpload`, `UploadCancelado`, `SecaoComProjetos`) |
| Feedback no painel | `sonner` (`toast.success` / `toast.error`) |
| Ícones | `lucide-react`, com `aria-hidden` quando decorativos |
| Slug | `gerarSlug()` — normaliza NFD, remove acentos, corta em 80 caracteres |
| Datas | `Date` na aplicação; `serverTimestamp()` na escrita |
| Formulários | TanStack Form, validando com `projectInputSchema.shape.<campo>` |
| Estilo de comentário | comentários explicam **por quê**, não o quê |

---

## 5. Separação de responsabilidades

```
src/
├─ main.tsx              monta React + QueryClientProvider + RouterProvider
├─ router.tsx            QueryClient (staleTime 5 min) e Router (preload 'intent')
├─ routeTree.gen.ts      GERADO — nunca editar à mão
├─ routes/               1 arquivo por rota; guard do admin; validação de search com Zod
├─ components/
│  ├─ site/              apresentação pública (sem shadcn)
│  ├─ admin/             painel (shadcn + dnd-kit + TanStack Table/Form)
│  └─ ui/                primitivos shadcn — GERADOS pelo CLI, só o painel usa
├─ hooks/                acesso a dados (Query/Mutation) + estado de UI (tema, revelar)
├─ lib/                  domínio e infraestrutura: schemas, converters, chaves,
│                        Firebase, auth, storage, upload, slug, cn
└─ styles/app.css        tokens dos dois sistemas de design + animações
```

Responsabilidade por camada:

- **Rotas** — decidem *o que* mostrar, validam parâmetros de busca, controlam
  acesso. Não conhecem Firestore.
- **Componentes** — desenham. Recebem dados por prop ou consomem hooks; não
  montam consultas.
- **Hooks** — sabem *como* buscar e gravar. Único lugar que fala com o Firestore.
- **lib** — sabe o *formato* do domínio e como falar com o Firebase.
- **Regras (`.rules`)** — a autorização real. A interface é conveniência; a regra
  é a defesa.

---

## 6. Fluxo de comunicação entre módulos

### 6.1 Leitura pública (home, listagem, projeto)

```
rota → useProjects()/useSections()/useSiteSettings()
     → TanStack Query (cache, staleTime 5 min)
     → getDocs(firestore)  [regra: published / visible]
     → converterLista → docParaX → schema.parse
     → componentes site/
```

Filtro por seção e destaque acontecem **em memória**, na rota
(`projetos.index.tsx`, `index.tsx`). `useProject(slug)` deriva o projeto e os
vizinhos anterior/próximo da mesma lista já em cache — sem leitura extra.

### 6.2 Guard do painel

```
navegação para /admin/*
  → admin.route.tsx beforeLoad
  → getCurrentUser() → ensureAuth() → import('firebase/auth')
  → auth.authStateReady()   (espera restaurar sessão persistida; evita piscar o login no F5)
  → sem usuário  → redirect /admin/login?redirect=<href>
```

`isRedirect(erro)` é reerguido: só falhas reais de autenticação caem no catch.

### 6.3 Escrita de um projeto (criar/editar)

```
admin.projetos.novo.tsx
  novoProjectId()                      id gerado ANTES de existir no Firestore
       │                               (o caminho de Storage projects/{id}/... precisa dele)
       ▼
FormularioProjeto
  ├─ título → gerarSlug() → campo slug (até ser editado à mão)
  ├─ slug   → slugEstaEmUso() (async, debounce 400 ms)
  ├─ capa   → CampoDeImagem  ─┐
  ├─ galeria→ GaleriaDoProjeto┤→ enviarImagem() → comprime (2400px + thumb 600px,
  │                           │                   WebP se suportado) → uploadBytesResumable
  └─ salvar → useCreateProject/useUpdateProject → projectInputSchema.parse → setDoc/updateDoc
              → invalidateQueries(projects.all)
```

`useBlocker` + `enableBeforeUnload` avisam sobre alterações não salvas.

### 6.4 Exclusão de seção

```
SecoesLista → iniciarExclusao → contarProjetosDaSecao(id)
  0 projetos  → ExcluirSecaoDialogo {tipo:'confirmar'} → useDeleteSection
  N projetos  → ExcluirSecaoDialogo {tipo:'mover'}     → useMoveProjectsToSection → useDeleteSection
```

`useDeleteSection` reconta antes de apagar e lança `SecaoComProjetos` se ainda
houver projetos. **Essa é a única proteção real**: uma regra do Firestore não
consegue consultar outra coleção.

### 6.5 Grafo de dependências entre módulos

```
routes ──► components/{site,admin} ──► components/ui
   │              │
   └──────────────┴──► hooks ──► lib/{queryKeys,converters,schemas,firebase,upload}
                                          │
                              upload ──► storage ──► firebase
                                auth ──────────────► firebase
```

Sem ciclos. `lib/` não importa de `hooks/`, `components/` nem `routes/`.

---

## 7. Dependências críticas

| Dependência | Papel | Se cair / mudar |
|---|---|---|
| **Firebase Firestore** | banco de conteúdo | o site não tem conteúdo; `EstadoErro` aparece em toda tela |
| **Firebase Storage** | imagens | capas e galerias quebram; upload falha |
| **Firebase Authentication** | acesso ao painel | ninguém publica nada |
| **Firebase Hosting** | entrega do bundle + rewrite SPA | rotas profundas retornam 404 |
| `@tanstack/react-router` + `router-plugin` | rotas e code splitting | perder `autoCodeSplitting` engorda o bundle público |
| `@tanstack/react-query` | cache e invalidação | cada navegação vira leitura nova (cota) |
| `zod` | tipos e validação | tipos do domínio somem (`z.infer`) |
| `browser-image-compression` | compressão antes do upload | imagens originais subiriam inteiras |
| `firestore.rules` / `storage.rules` | **autorização** | leitura/escrita indevidas |
| Node ≥ 22 | `scripts/seed.ts` usa `process.loadEnvFile` | o seed não roda |
| JDK | emuladores locais | `npm run emulators` falha |

Índices compostos exigidos por `firestore.indexes.json`: `projects(status, order)`
e `sections(visible, order)`. As duas consultas públicas dependem deles.

---

## 8. Riscos técnicos e acoplamentos

### 8.1 Divergência entre os UIDs de admin — **verificar**

`firestore.rules` usa `m6xE8kd3vpebcXgUT08qlbIeN8l2`; `storage.rules` usa
`Cty5hwrChLVMBv7aPHtC4HhjBx42`. O comentário em `storage.rules` diz "Mesmo UID do
firestore.rules". Os dois valores **não** são iguais no código atual.
Consequência: um dos dois lados nega escrita ao usuário real — publicar um
projeto com imagem falharia em metade do fluxo.
**Hipótese:** um dos arquivos ficou para trás numa troca de projeto/usuário
Firebase. Confira o UID em Authentication → Users e alinhe os dois arquivos.

### 8.2 Campos gravados que o site nunca lê

- `settings.seo.title`, `settings.seo.description`, `settings.seo.ogImage` são
  editáveis na aba *Compartilhamento* (`admin.configuracoes.tsx`), mas nenhuma
  rota pública os consome — `index.tsx` traz `<title>` e `description` fixos, e
  `index.html` não tem tags `og:`. O designer preenche e nada muda.
Isso é dívida funcional, não bug de código: a tela cumpre o que promete gravar,
mas o site não usa o que foi gravado.

`project.tags` saiu desta lista: desde o redesenho de `/projetos/$slug`, as tags
aparecem como chips na ficha técnica do projeto.

### 8.3 Open Graph por rota é estruturalmente impossível hoje

As tags `og:` de `/projetos/$slug` são inseridas pelo React em tempo de execução.
Robôs de WhatsApp/Instagram/Facebook leem o HTML cru, igual para todas as rotas.
Resolver exige prerender no build ou uma Cloud Function na frente do Hosting.

### 8.4 Acoplamentos que vale conhecer

- **`GaleriaDoProjeto` mantém `valorRef`** porque os envios rodam em sequência e o
  `valor` do formulário só reflete o item anterior no ciclo seguinte de render.
  Mexer nesse componente sem entender a ref reintroduz perda de imagens.
- **`CampoDeImagemSimples` adapta `StoredImage` → `SimpleImage`** preenchendo
  `width:1, height:1` de mentirinha. Funciona porque foto de perfil e imagem OG
  têm tamanho fixo no layout; se algum dia precisarem de `aspect-ratio`, esse
  atalho vira bug.
- **`FormularioProjeto` duplica a regra de publicação** (`status === 'published'
  && !coverImage`) que já existe em `publishableProjectSchema` — schema que **não
  é usado em lugar nenhum**. Duas fontes para a mesma regra, uma delas morta.
- **`queryKeys.projects.porSlug` e `queryKeys.projects.contagem` não são usados**;
  `FiltroProjetos` só é referenciado pela própria assinatura de
  `queryKeys.projects.admin`, sempre chamada sem argumento.
- **Reordenar opera sempre na lista completa**, nunca no recorte filtrado — em
  `ProjetosReordenar` e `SecoesLista`. Reordenar um subconjunto deixaria `order`
  inconsistente com os itens ocultos pelo filtro.
- **Bucket do Storage em `US-EAST1`, Firestore em `southamerica-east1`.** Latência
  extra nas imagens para o público brasileiro; a região de um bucket não muda
  depois de criado.

### 8.5 Sem testes automatizados

Não existe runner de teste, arquivo `*.test.*` nem `*.spec.*` no repositório. O
único portão automático é `npm run build` (checagem de tipos + build). O seed
funciona como teste prático das regras de segurança: se ele grava, as permissões
do lado do Firestore estão corretas.

**Consequência para o Spec Driven Development:** o contrato de execução da skill
`tlc-spec-driven` exige que testes derivados dos critérios de aceite passem antes
de uma tarefa ser considerada pronta. Hoje não há infraestrutura para isso — a
primeira feature que precisar de portão de teste precisa introduzir o runner como
tarefa explícita da própria spec.

### 8.6 Repositório sem git

Não há diretório `.git` neste projeto. O fluxo da skill `tlc-spec-driven`
pressupõe commits atômicos por tarefa (`check_commit.py`, reconciliação de
`STATE.md` contra o histórico). Rode `git init` antes de iniciar a primeira
feature pelo fluxo completo, ou o portão de commit fica sem como operar.

---

## 9. Diretrizes para futuras implementações

### 9.1 Onde colocar cada coisa

| Vou adicionar… | Vai em… |
|---|---|
| campo novo numa entidade | `lib/schemas.ts` primeiro; depois formulário, depois exibição |
| tela nova | `src/routes/` (o route tree é regenerado pelo plugin) |
| leitura/escrita nova | `src/hooks/`, com chave nova em `lib/queryKeys.ts` |
| componente do site | `components/site/`, Tailwind à mão, sem shadcn |
| componente do painel | `components/admin/`, shadcn liberado |
| primitivo shadcn novo | `npx shadcn add <componente>` → cai em `components/ui/` |
| regra de acesso | `firestore.rules` / `storage.rules` + `npm run deploy:rules` |

### 9.2 Checklist para um campo novo em `projects`

1. `projectInputSchema` (com `default`, para documentos antigos continuarem
   parseando);
2. valores padrão em `admin.projetos.novo.tsx`;
3. mapeamento em `admin.projetos.$id.tsx` (`valoresIniciais`);
4. campo no `FormularioProjeto`;
5. exibição em `PreviewProjetoDialog` e no site — **se não exibir, não adicione**
   (ver 8.2);
6. `scripts/seed.ts`, para o conteúdo de exemplo continuar representativo;
7. `npm run build`;
8. atualizar a documentação afetada e registrar: `npm run docs:update -- <docs>`.

### 9.3 Antes de considerar uma mudança pronta

```bash
npm run build      # checagem de tipos + build; é o único portão automático
```

- Mudou consulta pública? Confira se as regras permitem e se o índice existe.
- Mudou upload/exclusão? Confirme que nenhum arquivo fica órfão e que
  `apagarImagem` cobre `path` **e** `thumbPath`.
- Mudou peso do bundle? `npm run analyze` e verifique se Auth, Storage, Table,
  Form, dnd-kit e shadcn continuam fora do grafo do site público.
- Mudou tema? Confirme que `/admin` continua claro com o site em escuro.

### 9.4 Fluxo de trabalho obrigatório

Toda feature passa pela skill **`tlc-spec-driven`** (Specify → Design → Tasks →
Execute), com profundidade dimensionada pelo tamanho. Ver [CLAUDE.md](../CLAUDE.md).

---

## 10. Manutenção deste documento

Este arquivo é verificado por `scripts/docs-check.mjs`: ele guarda um hash do
código que descreve (`src/`, configs e regras) em `docs/.docs-manifest.json`.
Quando esse código muda, o documento aparece como **DEFASADO**.

```bash
npm run docs:check                       # o que precisa de revisão
npm run docs:update -- docs/ARQUITETURA.md   # registra a revisão feita
```
