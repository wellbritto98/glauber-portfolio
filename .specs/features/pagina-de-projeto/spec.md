# Página de Projeto — Redesenho (Direção A) Specification

## Problem Statement

A página `/projetos/{slug}` desagrada o dono do portfólio. O diagnóstico feito
sobre o código atual (`src/routes/projetos.$slug.tsx`) aponta cinco falhas
concretas: a capa é a única imagem do site com recorte forçado (`aspect-[16/10]`
+ `object-cover`), os metadados do projeto viram uma linha cinza de 12px, a
descrição fica isolada no meio de 96px de vazio, a galeria é uma grade de células
iguais que corta as peças de novo, e dois campos que já existem no schema —
`tags` e a seção — nunca aparecem na tela. A Direção A ("ficha editorial") foi
desenhada e aprovada no canvas de design; falta implementá-la.

Canvas aprovado: https://claude.ai/code/artifact/a4ca7607-7ec4-4bfa-bb7a-ff2c4a05fac6

## Goals

- [ ] Nenhuma imagem da página de projeto sofre recorte: capa e galeria usam a proporção real do arquivo.
- [ ] Cliente, ano, papel, seção e tags aparecem como ficha técnica legível, ao lado da descrição.
- [ ] Todo campo opcional vazio desaparece sem deixar rótulo órfão nem espaço reservado.
- [ ] `npm run build` passa (tsc `--noEmit` + build de produção) e a página é conferida no preview em 1440px e 390px.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Mudar a home, `/projetos` e `/sobre` | O pedido é sobre a página de projeto; a listagem já usa o ritmo que a nova galeria vai adotar |
| Filtro por tag (rota `/projetos?tag=`) | As tags passam a aparecer, mas não existe rota de filtro por tag hoje; criar uma é outra feature |
| Corrigir Open Graph por projeto | Débito conhecido e registrado no `CLAUDE.md`: robôs leem o HTML cru de uma SPA. Independe deste redesenho |
| Ler `settings.seo.*` no site | Outro débito conhecido, sem relação com esta página |
| Alterar o painel `/admin` ou o schema | A Direção A usa apenas campos que já existem em `projectSchema` |
| Introduzir suíte de testes automatizados | Decisão explícita do usuário nesta feature (ver Assumptions) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Portão de aceite sem testes automatizados | `npm run build` (tsc + build) e conferência visual no preview, em 1440px e 390px | O projeto não tem runner nem arquivo `*.test.*`; o usuário decidiu explicitamente manter só o build nesta feature | y |
| Seção não resolvível (consulta carregando, seção oculta ou `sectionId` órfão) | O trecho da seção some do breadcrumb e da ficha; o resto da página renderiza normalmente | `useSections()` só devolve seções com `visible == true`; a página do projeto não pode quebrar por causa de um dado secundário | n |
| Linha da ficha com campo vazio | A linha inteira não é renderizada | `client`, `role` e `description` têm `default('')` no schema; rótulo sem valor é ruído | n |
| Tags na ficha | Chips estáticos, sem link | Não existe rota de filtro por tag; link para lugar nenhum é pior que texto | n |
| Miniatura em anterior/próximo | `thumbUrl` quando existir, senão `url` | Mesma regra que `ProjectCard` já usa via `ImagemResponsiva usarThumb` | n |
| Ritmo da galeria | Reaproveitar `obterClasseSpan` de `components/site/gridSpan.ts` | É exatamente o ritmo assimétrico da listagem, já implementado e comentado | n |
| Tema escuro | Só tokens existentes (`ink`, `paper`, `surface`, `rule`, `brand`) | O site inteiro se pinta por esses tokens; cor nova exigiria decisão de design que não foi tomada | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Ficha técnica e capa sem recorte ⭐ MVP

**User Story**: Como visitante que avalia contratar o designer, quero ler cliente,
ano, papel e seção junto da descrição e ver a capa inteira, para julgar o trabalho
sem precisar adivinhar o contexto.

**Why P1**: São quatro dos cinco problemas do diagnóstico. Sem isso o redesenho não existe.

**Acceptance Criteria**:

1. The system SHALL renderizar a imagem de capa na proporção real do arquivo, sem `object-cover` e sem proporção fixa.  <!-- ubiquitous -->
2. WHEN o projeto tem `client`, `year`, `role` ou seção preenchidos THEN o sistema SHALL exibir cada um como uma linha da ficha técnica com rótulo e valor.  <!-- event-driven -->
3. IF um desses campos é string vazia THEN o sistema SHALL omitir a linha inteira daquele campo, sem rótulo e sem espaço reservado.  <!-- unwanted-behavior -->
4. WHEN o projeto tem `tags` não vazio THEN o sistema SHALL exibir as tags como chips estáticos abaixo da ficha.  <!-- event-driven -->
5. IF `tags` está vazio THEN o sistema SHALL não renderizar o bloco de chips.  <!-- unwanted-behavior -->
6. WHILE a viewport tem largura ≥ 1024px o sistema SHALL posicionar a descrição e a ficha lado a lado, descrição à esquerda e ficha à direita.  <!-- state-driven -->
7. IF `description` é string vazia THEN o sistema SHALL renderizar a ficha ocupando a largura total do container, sem coluna de texto vazia.  <!-- unwanted-behavior -->

**Independent Test**: abrir um projeto publicado com todos os campos preenchidos e conferir capa sem corte e ficha à direita; depois um com `client`, `role`, `description` e `tags` vazios e conferir que nenhum rótulo órfão aparece.

---

### P1: Galeria com proporção real e ritmo assimétrico ⭐ MVP

**User Story**: Como visitante, quero ver cada peça da galeria inteira e em ritmo
variado, para não olhar uma grade de retângulos iguais e cortados.

**Why P1**: É o quinto problema do diagnóstico e onde está o trabalho do designer.

**Acceptance Criteria**:

1. The system SHALL renderizar cada imagem da galeria na proporção real do arquivo, sem `object-cover`.  <!-- ubiquitous -->
2. WHILE a viewport tem largura ≥ 640px o sistema SHALL aplicar o ritmo de `obterClasseSpan` às imagens da galeria, na ordem de `order`.  <!-- state-driven -->
3. WHEN uma imagem da galeria tem `caption` preenchido THEN o sistema SHALL exibir a legenda abaixo dela.  <!-- event-driven -->
4. The system SHALL exibir, abaixo de cada imagem, o número de ordem da peça com dois dígitos, começando em 01.  <!-- ubiquitous -->
5. IF `gallery` está vazio THEN o sistema SHALL não renderizar o bloco da galeria, incluindo seu cabeçalho.  <!-- unwanted-behavior -->
6. WHEN o visitante ativa uma imagem da galeria THEN o sistema SHALL abrir o Lightbox no índice daquela imagem.  <!-- event-driven -->

**Independent Test**: abrir um projeto com 4 peças de proporções diferentes e conferir que nenhuma é cortada, que a 1ª e a 4ª ocupam duas colunas, e que clicar na 3ª abre o Lightbox nela.

---

### P2: Orientação — breadcrumb e navegação entre projetos

**User Story**: Como visitante, quero saber em que seção estou e voltar para a
listagem sem usar o botão do navegador, para não ficar preso na página.

**Why P2**: Melhora real de navegação, mas a página funciona sem isso.

**Acceptance Criteria**:

1. WHEN a seção do projeto é encontrada em `useSections()` THEN o sistema SHALL exibir um breadcrumb "Projetos › {nome da seção}" acima do título, com o nome da seção ligado a `/projetos?secao={slug}`.  <!-- event-driven -->
2. IF a seção não é encontrada ou a consulta de seções falhou THEN o sistema SHALL exibir apenas o segmento "Projetos", ligado a `/projetos`, e renderizar o resto da página normalmente.  <!-- unwanted-behavior -->
3. WHEN existe projeto anterior ou próximo THEN o sistema SHALL exibir, para cada um, a miniatura da capa, o rótulo e o título.  <!-- event-driven -->
4. IF o projeto vizinho não tem capa THEN o sistema SHALL exibir o bloco sem miniatura, mantendo rótulo e título.  <!-- unwanted-behavior -->
5. The system SHALL exibir um link "Ver todos os projetos" para `/projetos` no rodapé da navegação entre projetos.  <!-- ubiquitous -->

**Independent Test**: abrir o primeiro projeto da ordem e conferir breadcrumb com a seção, ausência do bloco "anterior" e presença do link para a listagem.

---

## Edge Cases

- IF a consulta de projetos está carregando THEN o sistema SHALL manter o esqueleto de carregamento já existente, sem tela branca.
- IF a consulta de projetos falhou THEN o sistema SHALL manter o `EstadoErro` com botão de nova tentativa.
- IF o slug não corresponde a nenhum projeto publicado THEN o sistema SHALL manter a tela "Projeto não encontrado" com link para `/projetos`.
- IF a consulta de seções ainda está carregando THEN o sistema SHALL renderizar a página sem o segmento da seção, sem bloquear o conteúdo.
- WHEN a viewport tem largura menor que 640px THEN o sistema SHALL empilhar ficha, descrição e galeria em coluna única.
- The system SHALL preservar as tags `<title>`, `<meta name="description">` e `og:*` que a rota já emite.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PROJ-01 | P1: Ficha e capa | Execute | Implementing |
| PROJ-02 | P1: Ficha e capa | Execute | Implementing |
| PROJ-03 | P1: Ficha e capa | Execute | Implementing |
| PROJ-04 | P1: Ficha e capa | Execute | Implementing |
| PROJ-05 | P1: Galeria | Execute | Implementing |
| PROJ-06 | P1: Galeria | Execute | Implementing |
| PROJ-07 | P2: Orientação | Execute | Pending |
| PROJ-08 | P2: Orientação | Execute | Pending |
| PROJ-09 | Edge cases | Execute | Pending |

**Mapa dos IDs:**

- PROJ-01 — capa na proporção real (P1 ficha, AC 1)
- PROJ-02 — ficha técnica com rótulo/valor e omissão de campo vazio (P1 ficha, AC 2 e 3)
- PROJ-03 — chips de tags e sua ausência (P1 ficha, AC 4 e 5)
- PROJ-04 — layout duas colunas ≥1024px e colapso sem descrição (P1 ficha, AC 6 e 7)
- PROJ-05 — galeria em proporção real com ritmo assimétrico (P1 galeria, AC 1 e 2)
- PROJ-06 — legenda, numeração, ausência de galeria e Lightbox (P1 galeria, AC 3 a 6)
- PROJ-07 — breadcrumb e degradação sem seção (P2, AC 1 e 2)
- PROJ-08 — anterior/próximo com miniatura e link para a listagem (P2, AC 3 a 5)
- PROJ-09 — estados de carregamento, erro, não encontrado, empilhamento mobile e metatags (Edge Cases)

**Coverage:** 9 total, 9 mapeados para as tarefas do Execute, 0 sem mapa.

---

## Success Criteria

- [ ] `npm run build` termina com código 0.
- [ ] No preview a 1440px: capa inteira, ficha à direita da descrição, galeria com 1ª e 4ª peças em duas colunas.
- [ ] No preview a 390px: tudo em coluna única, sem rolagem horizontal.
- [ ] Um projeto com `client`, `role`, `description`, `gallery` e `tags` vazios renderiza sem rótulo órfão e sem bloco vazio.
- [ ] `npm run docs:check` roda ao final e todo documento defasado é revisado antes de fechar a feature.
