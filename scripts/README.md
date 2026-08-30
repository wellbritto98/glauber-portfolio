# `scripts/` — Scripts de apoio

## Objetivo

Utilitários de linha de comando que rodam fora do navegador: povoar o Firestore
com conteúdo de exemplo e verificar o frescor da documentação.

## Arquivos

| Arquivo | Comando | Papel |
|---|---|---|
| `seed.ts` | `npm run seed` | cria 2 seções e 3 projetos publicados, com imagens SVG de exemplo |
| `docs-check.mjs` | `npm run docs:check` / `docs:update` | verifica se a documentação foi revisada depois da última mudança de código |

## `seed.ts`

**Roda direto no Node (v22+)**, sem `tsx` e sem `firebase-admin`: usa
`process.loadEnvFile('.env.local')` e o SDK web comum.

Autentica com `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, o que o torna também um
**teste prático das regras de segurança**: se o seed grava, as permissões do lado
do Firestore e do Storage estão corretas.

É **idempotente** — rodar de novo atualiza os mesmos registros em vez de
duplicá-los. As imagens são blocos SVG geométricos na paleta do site, em
proporções variadas: não são fotos, mas exercitam a grade assimétrica e a página
de projeto.

**Dependências:** `firebase/app`, `firebase/firestore`, `firebase/auth`,
`firebase/storage`; variáveis `VITE_FIREBASE_*` + as duas `SEED_*` em
`.env.local`.

> Nunca use uma chave de *service account* aqui. Ela ignora todas as regras de
> segurança; o `.gitignore` bloqueia esse padrão de nome como rede de proteção.

## `docs-check.mjs`

Sem dependências: só a biblioteca padrão do Node.

Mantém, no topo do arquivo, o mapa `AREAS` — **qual documento descreve quais
arquivos**. Para cada documento calcula um hash do conteúdo descrito e compara
com `docs/.docs-manifest.json`.

```bash
node scripts/docs-check.mjs                    # relatório; sai 1 se houver pendência
node scripts/docs-check.mjs --json             # mesmo relatório em JSON
node scripts/docs-check.mjs --hook             # saída para o hook Stop do Claude Code
node scripts/docs-check.mjs --update           # marca todos como revisados
node scripts/docs-check.mjs --update CLAUDE.md # marca só um
```

Estados possíveis: `ok`, `NOVO` (nunca registrado), `DEFASADO` (o código mudou
depois da última revisão) e `AUSENTE` (o documento não existe).

**Ao criar um documento novo, ou ao mover código de lugar, atualize `AREAS`.**
Um documento fora do mapa não é verificado por ninguém e apodrece em silêncio.

## Observações técnicas

- `tsconfig.json` inclui `scripts` na checagem de tipos; `npm run build` valida
  `seed.ts` junto com o resto.
- O hash não sabe se o texto está *certo*, só que o código descrito mudou. Quem
  julga o texto é quem revisa — o script só garante que ninguém esqueça de olhar.

## Débitos identificados

- `seed.ts` cobre hoje todos os campos do domínio (inclusive `tags`, `featured`
  e `seo`). Ao acrescentar um campo novo, atualize-o junto — o conteúdo de
  exemplo só serve para conferir layout enquanto for representativo.
- O seed grava dados reais no projeto Firebase configurado em `.env.local`. Não
  existe modo "simulação"; para experimentar sem tocar em produção, aponte o
  `.env.local` para os emuladores (`VITE_USE_EMULATORS=1`).
