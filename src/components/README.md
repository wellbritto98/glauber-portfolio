# `src/components/` — Componentes

## Objetivo

Toda a camada de apresentação, dividida em **três famílias com fronteiras
rígidas**.

## A fronteira (regra arquitetural)

```
components/
├─ site/    site público  →  Tailwind à mão. NUNCA importa de ui/
├─ admin/   painel        →  shadcn liberado
└─ ui/      primitivos shadcn — GERADOS pelo CLI. Usados SOMENTE pelo painel
```

**Por que a separação existe.** Os componentes do shadcn carregam utilitários
`dark:` (só o botão tem nove) e um peso considerável de Radix. Mantê-los fora do
site público:

1. preserva o code splitting — Radix, TanStack Table/Form e dnd-kit ficam fora do
   grafo de entrada que todo visitante baixa;
2. mantém os dois sistemas de tema independentes — o site alterna claro/escuro, o
   painel é sempre claro.

Verificação: nenhum arquivo de `site/` nem rota pública importa de
`@/components/ui`. Quando o site precisa de um primitivo acessível, usa Radix
cru — é o caso do `site/Lightbox.tsx`.

## Módulos

| Diretório | Conteúdo | Documento |
|---|---|---|
| `site/` | layout, card, imagem, lightbox, estados | [README](site/README.md) |
| `admin/` | tabela, formulários, upload, diálogos | [README](admin/README.md) |
| `ui/` | 15 primitivos shadcn | [README](ui/README.md) |

## Dependências

**Internas:** `admin/` → `ui/` + `@/hooks` + `@/lib`; `site/` → `@/hooks` +
`@/lib` + `radix-ui` (direto).

**Externas comuns:** `react`, `lucide-react`, `clsx`/`tailwind-merge` (via `cn`).
Exclusivas do painel: `radix-ui` (via shadcn), `@dnd-kit/*`,
`@tanstack/react-table`, `@tanstack/react-form`, `sonner`.

## Observações técnicas

- Componentes recebem dados por prop sempre que possível; consultam hooks apenas
  quando o dado é do próprio componente (ex.: `SiteLayout` lê `useSiteSettings`).
- Nomes de componentes e props em português; nomes de campos do domínio em
  inglês, como no schema.

## Débitos identificados

- Não há teste de componente algum.
- A regra "`ui/` só no painel" é convenção documentada, não verificada
  automaticamente. **Hipótese:** uma regra de lint de fronteira de import
  resolveria; hoje o projeto não tem ESLint configurado.
