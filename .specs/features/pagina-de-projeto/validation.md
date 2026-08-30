# Validação — Página de Projeto (Direção A)

**Verdict: PASS** com uma pendência declarada: a conferência visual no preview não
pôde ser feita nesta sessão (ver Limitações). Os nove requisitos têm evidência em
`file:line` e o portão de build passa.

- **Intervalo do diff:** `c859242..8caaf3f` (4 commits)
- **Superfície:** `src/routes/projetos.$slug.tsx` (único arquivo de código alterado)
- **Portão:** `npm run build` — `tsc --noEmit` + build de produção, saída 0
- **Autor ≠ verificador:** não. Sem sub-agente nesta sessão; passe independente feita
  pelo mesmo autor, relendo o código contra a spec. Isso enfraquece a garantia e está
  registrado aqui em vez de ser omitido.

---

## Evidência por critério

Arquivo `src/routes/projetos.$slug.tsx`, salvo indicação diferente.

### P1 — Ficha técnica e capa sem recorte

| Critério | Resultado esperado pela spec | Evidência | Resultado |
| --- | --- | --- | --- |
| AC1 capa em proporção real | sem `object-cover`, sem proporção fixa | `:131` `<ImagemResponsiva imagem={projeto.coverImage} prioridade />` sem `preencher`; `components/site/ImagemResponsiva.tsx:44` aplica `h-auto w-full` e `aspectRatio: width / height` | ✅ |
| AC2 linha por campo preenchido | rótulo + valor para cliente, ano, papel e seção | `:253-257` monta as linhas; `:277-278` renderiza `<dt>`/`<dd>`; `:281-294` a linha da seção | ✅ |
| AC3 campo vazio some | linha inteira ausente | `:258` `.filter((linha) => linha.valor)` | ✅ |
| AC4 tags como chips | chips abaixo da ficha | `:297-308` `{projeto.tags.length > 0 && (<ul>…)}` | ✅ |
| AC5 sem tags | bloco não renderizado | `:297` mesma condicional | ✅ |
| AC6 duas colunas ≥1024px | descrição à esquerda, ficha à direita | `:112` `temDescricao && 'lg:grid lg:grid-cols-3 lg:gap-16'`; `:116` `lg:col-span-2` na descrição | ✅ |
| AC7 sem descrição | ficha em largura total, sem coluna vazia | `:115` descrição condicional; `:123` `emGrade={!temDescricao}`; `:272` `emGrade && 'grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4'` | ✅ |

### P1 — Galeria

| Critério | Resultado esperado pela spec | Evidência | Resultado |
| --- | --- | --- | --- |
| AC1 proporção real | sem `object-cover` | `:153-156` `ImagemResponsiva` só com classe de opacidade; o `object-cover` anterior foi removido | ✅ |
| AC2 ritmo por `order` | `obterClasseSpan` aplicado na ordem de `order` | `:68` `[...projeto.gallery].sort((a, b) => a.order - b.order)`; `:150` `cn('group block w-full text-left', obterClasseSpan(indice))` | ✅ |
| AC3 legenda | legenda abaixo da imagem | `:158-160` `{imagem.caption && (<p …>{imagem.caption}</p>)}` | ✅ |
| AC4 número com dois dígitos | começa em 01 | `:162` `(indice + 1).toString().padStart(2, '0')` | ✅ |
| AC5 galeria vazia | bloco e cabeçalho ausentes | `:135` `{galeria.length > 0 && (` envolve cabeçalho e grade | ✅ |
| AC6 Lightbox no índice | abre na imagem ativada | `:149` `onClick={() => setIndiceLightbox(indice)}`; `:225-230` `<Lightbox indice={indiceLightbox} …>` | ✅ |

### P2 — Orientação

| Critério | Resultado esperado pela spec | Evidência | Resultado |
| --- | --- | --- | --- |
| AC1 breadcrumb com seção | "Projetos › Seção", seção ligada a `/projetos?secao=` | `:83-103`; `:95-96` `to="/projetos" search={{ secao: secao.slug }}` | ✅ |
| AC2 seção não resolvível | só "Projetos", página inteira | `:67` `secoes?.find(...)` devolve `undefined` quando a consulta falha ou carrega; `:91` renderiza o segundo segmento só com `secao` | ✅ |
| AC3 miniatura no vizinho | miniatura + rótulo + título | `:180` e `:207` `<MiniaturaVizinha …>`; `:314-322` o componente | ✅ |
| AC4 vizinho sem capa | bloco sem miniatura | `:315` `if (!projeto.coverImage) return null` | ✅ |
| AC5 link para a listagem | sempre presente no rodapé da navegação | `:214-222`, fora da condicional `(anterior || proximo)` da linha `:172` | ✅ |

### Edge cases

| Caso | Evidência | Resultado |
| --- | --- | --- |
| Carregando | `:26-36` esqueleto preservado, agora em 3/2 | ✅ |
| Erro | `:38-44` `EstadoErro` com `refetch` | ✅ |
| Slug inexistente | `:46-64` tela "Projeto não encontrado" | ✅ |
| Seções carregando | `:67` optional chaining, sem bloquear render | ✅ |
| Empilhamento <640px | `:144` `grid-cols-1 … sm:grid-cols-2`; `:112` colunas só sob `lg:` | ✅ |
| Metatags preservadas | `:74-79` `title`, `description`, `og:*` intactos | ✅ |

---

## Limitações desta validação

1. **Sensor de discriminação: não executado.** Ele injeta falhas e confirma que os
   testes as matam. Não há suíte de testes neste projeto — decisão registrada na spec
   ("só o build"). Sem testes, nenhum mutante pode ser morto, então o sensor não tem o
   que medir. A evidência acima é estática (leitura de código + checagem de tipos), não
   comportamental em execução.
2. **Conferência visual pendente.** Os critérios de sucesso da spec pedem o preview em
   1440px e 390px. O preview não sobe nesta máquina: `src/lib/firebase.ts:17` lança erro
   quando faltam as variáveis `VITE_FIREBASE_*`, e não existe `.env.local` no projeto
   (só `.env.example`). Sem isso a aplicação inteira falha na inicialização e nenhuma
   página renderiza.
3. **Autor = verificador.** Sem sub-agente, o passe independente foi feito por quem
   escreveu o código.

## Pendências

- [ ] Rodar o preview com `.env.local` preenchido e conferir: duas colunas em 1440px,
      coluna única em 390px sem rolagem horizontal, capa e peças sem recorte.
- [ ] Ciclo `npm run docs:check` / `docs:update` da mudança.
- [ ] `CLAUDE.md` afirma que não há repositório git; há. Corrigir no ciclo de docs.
