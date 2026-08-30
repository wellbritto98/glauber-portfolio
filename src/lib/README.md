# `src/lib/` — Núcleo compartilhado

## Objetivo

Concentrar o que não é interface: formato do domínio, conversão de dados,
inicialização do Firebase, upload de imagens e utilitários.

## Responsabilidade principal

Ser a **única** camada que conhece o Firebase e o formato dos documentos. Nada
aqui importa de `hooks/`, `components/` ou `routes/` — a dependência é sempre de
fora para dentro.

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `schemas.ts` | **fonte única de verdade dos tipos** — schemas Zod e `z.infer` |
| `converters.ts` | única camada `Timestamp` → `Date`; parse de snapshots |
| `queryKeys.ts` | todas as chaves de cache do TanStack Query |
| `firebase.ts` | `initializeApp` + Firestore (import estático) |
| `auth.ts` | Firebase Auth por **import dinâmico** |
| `storage.ts` | Firebase Storage por **import dinâmico** |
| `upload.ts` | validação, compressão, miniatura, progresso, cancelamento, exclusão |
| `slug.ts` | `gerarSlug()` — título em português → slug |
| `utils.ts` | `cn()` — `clsx` + `tailwind-merge` |

## Arquivos críticos

**`schemas.ts`** — mexer aqui muda os tipos de toda a aplicação.
Entidades: `StoredImage`, `GalleryImage`, `SimpleImage`, `Section`, `Project`
(com `ProjectStatus = 'draft' | 'published'`) e `SiteSettings`.
Cada entidade tem o par `xInput` (formulário/escrita) e `x` (leitura, com `id` e
datas). Campos novos devem ter `default`, senão documentos antigos param de
parsear.

**`firebase.ts`** — valida a configuração no import e **lança** se faltar alguma
variável `VITE_FIREBASE_*`, com a lista do que falta. Exporta `app`, `db` e
`useEmulators`. Só o Firestore é estático: é a única parte do SDK de que o site
público precisa.

**`auth.ts` / `storage.ts`** — o import dinâmico não é preferência de estilo. As
definições de rota do TanStack Router ficam na parte crítica do route tree, que
não sofre code splitting; um import estático de `firebase/auth` no guard do
`/admin` levaria o SDK inteiro para o bundle de todo visitante.
`ensureAuth()` também aguarda `auth.authStateReady()` antes de devolver o bundle
— sem isso, um F5 no `/admin` redirecionaria para o login por um instante.

**`upload.ts`** — limite de **10 MB** no arquivo original; comprime para
2400 px (imagem) e 600 px (miniatura), em WebP quando o navegador suporta
(detectado uma vez por sessão), qualidade 0,85. Devolve
`{ promessa, cancelar }` porque um envio grande precisa poder ser abortado.
A barra reserva 0–10% para a compressão, 10–25% para a miniatura e 25–100% para
a imagem principal. `apagarArquivo` trata `object-not-found` como sucesso — o
objetivo (não existir) foi atingido.

## Dependências

**Internas:** `auth.ts` e `storage.ts` → `firebase.ts`; `upload.ts` → `storage.ts`
+ `schemas.ts`; `converters.ts` → `schemas.ts`.

**Externas:** `firebase/app`, `firebase/firestore` (estáticos);
`firebase/auth`, `firebase/storage` (dinâmicos); `zod`;
`browser-image-compression`; `clsx`; `tailwind-merge`.

## Módulos relacionados

Consumido por `hooks/` (dados), `components/admin/` (upload) e `routes/`
(guard via `auth.ts`).

## Fluxos importantes

**Leitura:** `getDocs` → `converterLista(snaps, docParaX, rótulo)` → `schema.parse`.
Documento malformado é descartado com `console.warn` — um registro corrompido não
derruba a galeria inteira.

**Upload:** `validarArquivo` → `comprimir` (principal + miniatura em paralelo) →
`uploadBytesResumable` da miniatura → da imagem → `StoredImage`.

**Exclusão:** `apagarImagem` remove `path` **e** `thumbPath`.

## Observações técnicas e débitos

- **`publishableProjectSchema` não é usado em lugar nenhum.** A regra "publicado
  exige capa" está reimplementada à mão em `FormularioProjeto`. Duas fontes para
  a mesma regra, uma delas morta.
- **`queryKeys.projects.porSlug` e `queryKeys.projects.contagem` não têm nenhum
  consumidor.** `FiltroProjetos` só aparece na assinatura de
  `queryKeys.projects.admin`, sempre chamada sem argumento.
- `SiteSettings` é apenas um alias de `SiteSettingsInput`: a leitura e a escrita
  têm exatamente o mesmo formato (o documento não guarda datas).
- As chaves `VITE_*` não são segredo — elas vão no JavaScript que qualquer
  visitante baixa. Quem protege os dados são as regras, não as chaves.
