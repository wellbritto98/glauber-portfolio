# `src/styles/` — Estilos

## Objetivo

Único arquivo de estilo do projeto (`app.css`): imports do Tailwind e das fontes,
tokens dos **dois** sistemas de design e as animações de entrada do site público.

## Responsabilidade principal

Definir as variáveis CSS que separam site público e painel, e o mecanismo de tema
que impede um de vazar no outro.

## Estrutura de `app.css`

| Bloco | Conteúdo |
|---|---|
| `@import` | `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`, fontes Bricolage Grotesque e Public Sans |
| `@custom-variant dark` | `&:is(.dark *)` — o escuro depende de um ancestral com `.dark` |
| `@theme inline` | tipografia (`--font-display`, `--font-body`) + mapeamento dos tokens |
| `:root` | paleta do site (claro) **e** tokens do shadcn (sempre claros) |
| `.dark` | **apenas** as variáveis do site público |
| `html[data-site-theme]` | pinta o fundo do documento e define `color-scheme` |
| `@layer base` | reset de borda/outline, tipografia do corpo, `::selection` |
| Animações | `@keyframes surgir`, classes `.surgir` e `.revelar` |
| `prefers-reduced-motion` | dois blocos — ver observações |

## Os dois sistemas de token

| Site público | Painel (shadcn) |
|---|---|
| `--paper`, `--surface` | `--background`, `--card`, `--muted` |
| `--ink`, `--ink-muted`, `--ink-faint` | `--foreground`, `--muted-foreground` |
| `--rule` | `--border`, `--input` |
| `--brand` | `--primary`, `--destructive` |
| muda no `.dark` | **não** muda: o painel é sempre claro |

Paleta do site em OKLCH: branco levemente quente (croma ≤ 0,004), preto quente e
um acento terracota discreto — a cor forte vem do trabalho do designer, não da
interface. Os tokens de texto passam de 4,5:1 sobre o fundo nos dois temas.

## Fluxo do tema

```
useTheme  →  html[data-site-theme="dark"]   (fundo do documento, color-scheme)
SiteLayout →  <div class="dark">            (escopo real do tema escuro)
```

A classe `.dark` **nunca** vai no `<html>`. Os componentes do shadcn usam
utilitários `dark:` (só o botão tem nove); com `.dark` no documento, o painel
herdaria estilos escuros mesmo com as variáveis redeclaradas para claro. Com a
classe no wrapper, a subárvore do `/admin` simplesmente nunca é descendente de
`.dark`.

## Dependências

**Internas:** consumido por `main.tsx`; as classes `.surgir` e `.revelar` são
usadas por `routes/index.tsx` e `components/site/ProjectCard.tsx`.

**Externas:** `tailwindcss` 4 (via `@tailwindcss/vite`), `tw-animate-css`,
`shadcn/tailwind.css`, `@fontsource-variable/*`.

## Observações técnicas

- **Há dois blocos `prefers-reduced-motion`, e isso é proposital.** O bloco
  global zera durações, mas o estado inicial de `.revelar` é `opacity: 0` — um
  card que nunca dispara o observador ficaria invisível. O primeiro bloco anula
  esse estado inicial explicitamente.
- As animações substituem a biblioteca `motion`, que custava 119 kB no bundle do
  visitante para produzir exatamente este fade com deslocamento.
- Não existe `tailwind.config.js`: Tailwind 4 é configurado por CSS
  (`@theme inline`), e `components.json` aponta `tailwind.config` para string
  vazia.

## Débitos identificados

- Os valores de fundo em `html[data-site-theme]` repetem literalmente os OKLCH de
  `--paper` de cada tema. Como estão fora do escopo onde as variáveis mudam, não
  dá para referenciá-las — mas se a paleta mudar, **os dois lugares** precisam
  ser atualizados juntos.
