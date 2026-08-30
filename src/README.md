# `src/` — Aplicação

## Objetivo

Todo o código que roda no navegador: site público e painel administrativo no
mesmo bundle, separados por rota e por sistema de design.

## Responsabilidade principal

Montar a aplicação React, ligar o roteador ao cliente de cache e distribuir a
responsabilidade entre as camadas descritas abaixo.

## Estrutura

| Caminho | Papel | Documento |
|---|---|---|
| `main.tsx` | ponto de entrada: React 19 + Query + Router | — |
| `router.tsx` | instâncias de `QueryClient` e `Router` | — |
| `routeTree.gen.ts` | **gerado** pelo `@tanstack/router-plugin` | não editar |
| `routes/` | uma rota por arquivo, guard do admin | [README](routes/README.md) |
| `components/` | site, painel e primitivos shadcn | [README](components/README.md) |
| `hooks/` | acesso a dados e estado de UI | [README](hooks/README.md) |
| `lib/` | domínio e infraestrutura | [README](lib/README.md) |
| `styles/` | tokens de tema e animações | [README](styles/README.md) |

## Pontos de entrada

- **`main.tsx`** — chamado por `index.html`. Monta `<StrictMode>` →
  `<QueryClientProvider>` → `<RouterProvider>` e importa `styles/app.css`.
- **`router.tsx`** — configura:
  - `QueryClient`: `staleTime` de 5 minutos, `retry: 1`,
    `refetchOnWindowFocus: false` (conteúdo muda pouco e cada leitura conta na
    cota do Firestore; as rotas do admin sobrescrevem com `staleTime` curto);
  - `Router`: `defaultPreload: 'intent'`, `scrollRestoration: true` e o contexto
    `{ queryClient }` tipado em `routes/__root.tsx`.

## Dependências

**Internas:** `main.tsx` → `router.tsx` → `routeTree.gen.ts` → todas as rotas.

**Externas:** `react`, `react-dom`, `@tanstack/react-router`,
`@tanstack/react-query`.

## Fluxo de dados

```
rota → hook (TanStack Query) → lib/converters → lib/schemas (parse) → componente
```

Escrita percorre o caminho inverso e termina em `invalidateQueries` com uma chave
de `lib/queryKeys.ts`.

## Observações técnicas

- `routeTree.gen.ts` é regenerado a cada `dev`/`build`. Editá-lo à mão é perda de
  trabalho garantida.
- O alias `@/` aponta para este diretório (`tsconfig.json` e `vite.config.ts`).
- Identificadores em português; campos persistidos em inglês. A fronteira é
  `lib/schemas.ts`.

## Débitos identificados

- Sem testes automatizados em qualquer camada. O único portão é `npm run build`.
