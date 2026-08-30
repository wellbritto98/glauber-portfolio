# `src/components/ui/` — Primitivos shadcn/ui

## Objetivo

Os componentes de base do painel administrativo, gerados pelo CLI do shadcn.

## Responsabilidade principal

Fornecer primitivos acessíveis (Radix + Tailwind + `class-variance-authority`)
com o estilo configurado em `components.json`: estilo `radix-nova`, cor base
`neutral`, variáveis CSS, ícones `lucide`.

## Regra de uso

**Estes componentes são exclusivos do painel.** Nenhum arquivo de
`components/site/` ou rota pública importa daqui. Manter essa fronteira é o que
guarda o code splitting (Radix fora do bundle do visitante) e o isolamento de
tema (o painel é sempre claro).

Quando o site público precisa de um primitivo acessível, importa `radix-ui`
diretamente e estiliza à mão — como o `site/Lightbox.tsx`.

## Inventário

`alert-dialog` · `badge` · `button` · `card` · `dialog` · `dropdown-menu` ·
`input` · `label` · `select` · `skeleton` · `sonner` · `switch` · `table` ·
`tabs` · `textarea`

## Como adicionar um novo

```bash
npx shadcn add <componente>
```

O CLI usa os aliases de `components.json` (`@/components/ui`, `@/lib/utils`) e
grava o arquivo aqui. **Prefira o CLI a escrever à mão** — é o que mantém os
arquivos consistentes com o restante e atualizáveis.

## Dependências

**Internas:** `@/lib/utils` (`cn`).

**Externas:** `radix-ui`, `class-variance-authority`, `tailwind-merge`, `clsx`,
`lucide-react`, `sonner` (só `sonner.tsx`), `tw-animate-css` (via `app.css`).

## Observações técnicas

- Estes arquivos são **gerados**. Edições locais são possíveis, mas somem se o
  componente for regerado — anote qualquer customização deliberada no próprio
  arquivo, com comentário.
- Os tokens que eles consomem (`--background`, `--foreground`, `--primary`, …)
  estão em `src/styles/app.css`, no bloco `:root`, e **não** mudam no tema
  escuro: o painel é sempre claro.

## Débitos identificados

- `sonner.tsx` é o único arquivo aqui com dependência externa própria; o
  `<Toaster/>` é montado em `admin.route.tsx`.
- Nada garante automaticamente a regra "só no painel" (ver
  [components/README.md](../README.md)).
