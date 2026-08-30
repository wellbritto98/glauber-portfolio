---
description: Revisa e atualiza a documentação defasada contra o código real
---

Sincronize a documentação deste repositório com o código.

## Passo 1 — descobrir o que está defasado

```bash
npm run docs:check
```

Se nada estiver pendente, diga isso em uma linha e pare.

## Passo 2 — revisar cada documento pendente

Para **cada** documento listado:

1. Abra o documento.
2. Abra os arquivos que ele descreve (o mapa `AREAS` no topo de
   `scripts/docs-check.mjs` diz exatamente quais).
3. Corrija toda afirmação que deixou de ser verdadeira: nomes de arquivo,
   caminhos, dependências, fluxos, comandos, riscos e débitos.
4. Acrescente o que passou a existir e remova o que deixou de existir.

Regras de conteúdo, sem exceção:

- **Nunca invente comportamento.** Só afirme o que está no código, na
  configuração ou nas regras de segurança.
- Inferência vai marcada como **Hipótese**, explicitamente.
- Um README de módulo cobre: objetivo, responsabilidade principal,
  funcionalidades, dependências internas e externas, módulos relacionados,
  pontos de entrada, fluxos importantes, arquivos críticos, observações técnicas
  e débitos identificados.
- Nada em um documento local pode contradizer `docs/ARQUITETURA.md` ou
  `docs/OBJETIVO.md`. Se contradiz, o global também precisa de revisão —
  inclua-o.
- Débito novo que você encontrar (código órfão, acoplamento excessivo, violação
  da fronteira `components/ui` só no painel, regra duplicada) entra na seção de
  débitos do módulo e, se for arquitetural, em `docs/ARQUITETURA.md §8`.

## Passo 3 — cobrir diretórios novos

Se algum diretório relevante ficou sem `README.md`:

1. escreva o README no padrão acima;
2. **registre a área no mapa `AREAS` de `scripts/docs-check.mjs`** — documento
   fora do mapa não é verificado por ninguém e apodrece em silêncio.

## Passo 4 — registrar a revisão

Só depois de ter lido e corrigido de fato:

```bash
npm run docs:update -- <documentos revisados>
```

## Passo 5 — relatar

Liste, em poucas linhas: o que mudou em cada documento, os débitos novos
registrados e o que ficou sem resolver.
