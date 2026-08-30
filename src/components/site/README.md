# `src/components/site/` — Componentes do site público

## Objetivo

A camada visível para o visitante anônimo: casca do site, cartão de projeto,
imagem, lightbox e estados de carregamento/erro.

## Responsabilidade principal

Apresentar conteúdo já carregado. **Nenhum componente aqui importa de
`@/components/ui`** — o site é escrito com Tailwind à mão, e quando precisa de um
primitivo acessível usa Radix cru.

## Arquivos

| Arquivo | Papel |
|---|---|
| `SiteLayout.tsx` | cabeçalho, rodapé e o **wrapper que recebe a classe `.dark`** |
| `ProjectCard.tsx` | cartão da home e da listagem; prefetch no hover/foco |
| `ImagemResponsiva.tsx` | `<img>` padrão do site: dimensões reais, `lazy`, `decoding` assíncrono |
| `Lightbox.tsx` | galeria ampliada, Radix Dialog cru |
| `Estado.tsx` | `EstadoErro`, `EsqueletoLinha`, `EsqueletoGrade` |
| `gridSpan.ts` | ritmo assimétrico da grade |

## Arquivos críticos

**`SiteLayout.tsx`** — aplica `.dark` **no próprio wrapper**, nunca no `<html>`.
Se a classe subisse para o documento, a subárvore do `/admin` viraria descendente
de `.dark` e herdaria os utilitários escuros do shadcn. Lê `useSiteSettings` para
nome, e-mail e redes; o botão de tema tem rótulo descritivo e área de toque de
44 px.

**`ImagemResponsiva.tsx`** — sempre com `width`/`height` reais, o que reserva o
espaço via `aspect-ratio` e evita layout shift. `usarThumb` troca para a versão
de 600 px (grades e cards); `prioridade` liga `loading="eager"` +
`fetchPriority="high"` para a primeira imagem acima da dobra; `preencher` usa
`object-cover` sem proporção própria.

**`Lightbox.tsx`** — Radix Dialog sem estilos do shadcn. Setas ← → navegam em
ciclo, Esc fecha (padrão do Radix), o título fica em `VisuallyHidden` e o
`onOpenAutoFocus` é bloqueado para o foco não pular para a imagem.

## Dependências

**Internas:** `@/hooks/useSiteSettings`, `@/hooks/useTheme`, `@/hooks/useRevelar`,
`@/hooks/useProjects` (só `opcoesProjetosPublicados`), `@/lib/schemas`,
`@/lib/utils`.

**Externas:** `@tanstack/react-router` (Link), `@tanstack/react-query`
(prefetch), `radix-ui` (Dialog e VisuallyHidden), `lucide-react`.

## Módulos relacionados

Usados exclusivamente pelas rotas públicas: `index.tsx`, `projetos.index.tsx`,
`projetos.$slug.tsx`, `sobre.tsx`, `$.tsx`.

## Fluxos importantes

**Prefetch por intenção:** `ProjectCard` dispara
`prefetchQuery(opcoesProjetosPublicados)` no `mouseenter` e no `focus`; a
navegação para a página do projeto costuma achar tudo em cache.

**Revelação ao rolar:** `useRevelar` alterna `data-visivel`, e o CSS (`.revelar`
em `styles/app.css`) faz o fade com deslocamento. Substitui a biblioteca `motion`
— 119 kB a menos no que o visitante baixa.

**Grade assimétrica:** `obterClasseSpan(indice)` faz o 1º e o 4º de cada grupo de
6 ocuparem duas colunas a partir do breakpoint `sm`. Combinado com a proporção
real das imagens, evita a grade uniforme de cards.

## Observações técnicas e débitos

- `EsqueletoGrade` **replica à mão** a regra de span do `gridSpan.ts`
  (`indice % 6 === 0 || indice % 6 === 3`) em vez de chamar `obterClasseSpan`.
  Duas cópias da mesma regra: mudar uma sem a outra faz o esqueleto deixar de
  bater com o resultado final.
- `SiteLayout` ignora `isError` de `useSiteSettings` e cai no fallback
  `'Portfólio'` — proposital: cabeçalho e rodapé nunca somem, o erro aparece no
  conteúdo da rota.
- Nenhum componente aqui exibe `project.tags`, embora o painel deixe editá-las.
