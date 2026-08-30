# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Idioma deste repositório: **português do Brasil**. Código, comentários,
> documentação, mensagens de interface e commits são em português.

---

## 0. Regra zero — trabalhe pela skill `tlc-spec-driven`

Toda mudança de comportamento neste projeto passa pela skill **`tlc-spec-driven`**
(Specify → Design → Tasks → Execute, com profundidade dimensionada pelo escopo).

**Quando invocar:** qualquer pedido de feature, correção com efeito visível,
mudança de regra de negócio, alteração de schema ou de regras de segurança.

**Quando NÃO invocar:** perguntas sobre o código, leitura, análise, ajuste de
uma linha sem efeito de comportamento, e a atualização da própria documentação.

Antes de escrever código, leia os documentos oficiais — eles são o insumo das
fases Specify e Design:

| Documento | Quando ler |
|---|---|
| [`docs/OBJETIVO.md`](docs/OBJETIVO.md) | sempre, antes de especificar: propósito, atores, fluxos de negócio |
| [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) | sempre, antes de projetar: padrões, regras, riscos, diretrizes |
| `README.md` do módulo tocado | antes de editar qualquer arquivo daquele módulo |
| `README.md` da raiz | instalação, operação, guia do painel |

Artefatos da skill vivem em `.specs/` (ainda não existe; será criado na primeira
feature). Decisões de projeto vão para `.specs/STATE.md`.

**Duas condições do ambiente que afetam o contrato da skill:**

1. **Não há testes automatizados** — nenhum runner, nenhum `*.test.*`. O contrato
   de execução exige que testes derivados dos critérios de aceite passem antes de
   uma tarefa ser dada como pronta. A primeira feature que precise desse portão
   deve introduzir o runner como tarefa explícita da própria spec, e dizer isso
   ao usuário em vez de fingir que o portão existe.
2. **O repositório git existe.** Commits atômicos por tarefa e `check_commit.py`
   operam normalmente. Branch padrão `main`; comece uma feature em branch
   própria. `git push` continua exigindo autorização explícita (ver §5).

---

## 1. Comandos

```bash
npm install            # instalar dependências
npm run dev            # servidor de desenvolvimento (http://localhost:5173)
npm run build          # tsc --noEmit + build de produção — ÚNICO portão automático
npm run preview        # servir o build localmente
npm run analyze        # build + relatório de bundle em stats.html
npm run seed           # popular o Firestore com conteúdo de exemplo (grava de verdade)
npm run emulators      # emuladores locais do Firebase (exige JDK)
npm run deploy         # build + deploy completo
npm run deploy:rules   # publicar só regras e índices
npm run docs:check     # o que precisa de revisão na documentação
npm run docs:update    # registrar documentação revisada
```

**Rodar um teste isolado: não se aplica** — o projeto não tem suíte de testes.
Antes de considerar qualquer mudança pronta, rode `npm run build`: ele faz a
checagem de tipos (TypeScript 7, `strict`) e o build de produção.

Para ver o app rodando, use o preview do harness com a configuração `portfolio`
de `.claude/launch.json` — nunca `npm run dev` pelo Bash.

---

## 2. Arquitetura em uma página

SPA client-only. **Sem backend**: o navegador fala direto com o Firebase, e a
autorização é inteiramente das regras do Firestore e do Storage.

**Duas aplicações no mesmo bundle**, separadas por rota e por sistema de design:
site público (Tailwind à mão, tema claro/escuro) e painel `/admin`
(shadcn/ui, sempre claro).

```
routes/ → hooks/ (TanStack Query) → lib/converters → lib/schemas (Zod) → Firestore
                                          ▲
components/{site,admin} ──────────────────┘
```

Detalhes completos em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md); cada
diretório tem seu próprio README.

### Decisões que não são óbvias lendo um arquivo só

1. **`firebase/auth` e `firebase/storage` só entram por `await import()`**
   (`lib/auth.ts`, `lib/storage.ts`). As definições de rota do TanStack Router
   ficam na parte crítica do route tree, que não sofre code splitting — um import
   estático no guard levaria o SDK de auth para o bundle de todo visitante.
2. **`admin_.login.tsx` tem underline.** O sufixo `_` dá o caminho
   `/admin/login` **sem** herdar o layout de `admin.route.tsx`. Se herdasse, o
   guard redirecionaria para o login, que dispararia o guard de novo: laço
   infinito.
3. **A classe `.dark` nunca vai no `<html>`.** Ela fica no wrapper do
   `SiteLayout`; o `<html>` recebe só `data-site-theme`. Com `.dark` no
   documento, o painel herdaria os utilitários `dark:` do shadcn.
4. **Uma consulta só alimenta home, listagem e página de projeto.**
   `buscarProjetosPublicados()` é a única leitura pública; o filtro por seção,
   destaque e o "anterior/próximo" acontecem em memória. Mais barato em cota e em
   índices compostos.
5. **`components/ui/**` é exclusivo do painel.** O site público usa Tailwind à
   mão e, quando precisa de primitivo acessível, importa `radix-ui` cru
   (`site/Lightbox.tsx`).
6. **`Timestamp` só existe dentro de `lib/converters.ts`.**
7. **Toda query key vem de `lib/queryKeys.ts`.** Nenhuma string literal fora dali.
8. **`novoProjectId()` gera o id antes do documento existir**, porque o caminho
   no Storage é `projects/{id}/...` e precisa existir na primeira imagem.
9. **Ao excluir um projeto, os arquivos saem primeiro, o documento depois.**
   Arquivo órfão ninguém vê; documento com imagem inexistente aparece quebrado.
10. **Consulta pública precisa espelhar a regra de segurança.** Sem
    `where('visible','==',true)` / `where('status','==','published')`, o Firestore
    recusa a listagem inteira.

### Riscos conhecidos (não "conserte" sem falar com o usuário)

- **Os UIDs de admin divergem** entre `firestore.rules`
  (`m6xE8kd3vpebcXgUT08qlbIeN8l2`) e `storage.rules`
  (`Cty5hwrChLVMBv7aPHtC4HhjBx42`), apesar do comentário dizer que são o mesmo.
  Um dos lados nega escrita ao usuário real. Trocar um UID de regra é ação
  externa e irreversível na prática — confirme com o usuário antes.
- **`settings.seo.*` é gravado e nunca lido** pelo site. `project.tags` deixou de
  ser: aparece como chips na ficha técnica de `/projetos/$slug`.
- **Open Graph por projeto não funciona** — robôs leem o HTML cru.

---

## 3. Convenções obrigatórias

| Assunto | Regra |
|---|---|
| Idioma | identificadores em português; campos persistidos no Firestore em inglês (a fronteira é `lib/schemas.ts`) |
| Tipos | saem de `z.infer`. **Não** criar `interface` paralela para entidade de domínio |
| Campo novo no schema | sempre com `default`, senão documentos antigos param de parsear |
| Imports de tipo | `import type` (o projeto usa `verbatimModuleSyntax`) |
| Alias | `@/` → `src/` |
| Versões | **fixadas**, sem `^`. Ao atualizar qualquer uma, rode `npm run build` antes de confiar |
| Comentários | explicam **por quê**, não o quê. Mantenha a densidade do arquivo vizinho |
| Mensagens ao usuário | português, acionáveis; erro de SDK sempre traduzido |
| Erros de domínio | classe própria (`ErroDeUpload`, `UploadCancelado`, `SecaoComProjetos`) |
| Feedback no painel | `sonner` |
| Estados de consulta | sempre carregamento + erro + vazio. Nunca tela branca |
| `routeTree.gen.ts` | **gerado** — nunca editar |
| `components/ui/*` | gerados por `npx shadcn add` — prefira o CLI a escrever à mão |

---

## 4. Documentação auto-atualizável

A documentação deste repositório é verificada por código, não por memória.

`scripts/docs-check.mjs` guarda em `docs/.docs-manifest.json` um hash do código
que cada documento descreve. Quando esse código muda, o documento fica
**DEFASADO** — e um hook `Stop` avisa ao fim da sessão.

### Obrigação ao terminar qualquer mudança de código

1. `npm run docs:check`
2. Para cada documento defasado, **releia o texto contra o código** e corrija o
   que ficou falso. Não registre revisão sem ter lido.
3. `npm run docs:update -- <documentos revisados>`
4. Se a mudança criou um diretório novo, crie o `README.md` dele **e** registre a
   área no mapa `AREAS` de `scripts/docs-check.mjs` — documento fora do mapa não
   é verificado por ninguém.

O atalho `/docs-sync` executa esse ciclo inteiro.

### Regras de escrita da documentação

- **Nunca invente comportamento.** Tudo afirmado deve estar no código, na
  configuração ou nas regras.
- Inferência vai marcada como **Hipótese**, explicitamente.
- Documento de módulo cobre: objetivo, responsabilidade, funcionalidades,
  dependências internas e externas, módulos relacionados, pontos de entrada,
  fluxos, arquivos críticos, observações técnicas e débitos.
- Documento local não pode contradizer `docs/ARQUITETURA.md` nem
  `docs/OBJETIVO.md`. Achou divergência, corrija a documentação — e, se a
  divergência for do código, registre como débito em vez de silenciar.
- Débito identificado fica registrado, mesmo sem plano de correção.

---

## 5. Fronteiras de ação

Aprovar uma spec ou uma lista de tarefas autoriza **implementação e commits
locais**. Continuam exigindo autorização explícita do usuário, uma a uma:

- `npm run deploy` e `npm run deploy:rules` (publicam para o mundo);
- `npm run seed` (grava dados reais no projeto Firebase configurado);
- alterar UID em `firestore.rules` / `storage.rules`;
- qualquer operação no console do Firebase ou via MCP do Firebase que escreva,
  apague ou mude configuração de projeto;
- `git push` e qualquer operação remota.

Nunca coloque uma chave de *service account* (`*-adminsdk-*.json`) neste projeto:
ela ignora todas as regras de segurança. O `.gitignore` bloqueia esse padrão de
nome como rede de proteção, mas a regra é não trazer o arquivo.

As chaves `VITE_*` **não** são segredo — vão no JavaScript que qualquer visitante
baixa, e é assim que o Firebase foi projetado. Quem protege os dados são as
regras. `.env.local` mesmo assim está no `.gitignore`, porque contém a senha do
admin usada pelo seed.
