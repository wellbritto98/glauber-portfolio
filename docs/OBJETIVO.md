# Objetivo do Sistema

> Documento oficial de produto. Base para desenvolvimento em Spec Driven
> Development (skill `tlc-spec-driven`). Derivado do código: schemas do domínio,
> rotas, regras de segurança e textos da própria interface. Inferências estão
> marcadas como **Hipótese**.
>
> Documentos irmãos: [Arquitetura do Sistema](ARQUITETURA.md) · [CLAUDE.md](../CLAUDE.md)

---

## 1. Propósito principal

Dar a um **designer gráfico** um site de portfólio profissional **que ele mesmo
mantém**, sem depender de desenvolvedor para publicar um trabalho novo, trocar
uma imagem, reordenar a vitrine ou corrigir um texto.

O sistema entrega duas coisas no mesmo produto:

1. **um site público** — vitrine editorial, responsiva, com modo escuro, pensada
   para que a cor forte venha do trabalho exibido e não da interface;
2. **um painel administrativo** (`/admin`) — usuário único, protegido por login,
   com linguagem de designer e não de programador.

---

## 2. Problemas que ele resolve

| Problema | Como o sistema resolve |
|---|---|
| Publicar trabalho novo depende de terceiros | painel próprio: criar, publicar e reordenar sem tocar em código |
| Exportar imagem no tamanho certo é trabalho manual | upload aceita arquivo grande (até 10 MB) e comprime no navegador para 2400 px + miniatura de 600 px, em WebP quando suportado |
| Portfólio genérico com grade uniforme | grade assimétrica (`gridSpan.ts`) e imagens na proporção real, sem recorte forçado |
| Trabalho em andamento não pode aparecer no site | status `draft` / `published`; rascunho é invisível para o público, garantido pela **regra do Firestore**, não só pela interface |
| Tirar algo do ar sem perder o material | despublicar devolve ao rascunho, com imagens preservadas |
| Categoria nova em montagem | seção com `visible: false` some do site sem apagar nada |
| Projeto órfão numa exclusão de seção | não é possível excluir seção com projetos; o painel conta e oferece mover todos para outra |
| Página em branco quando a rede falha | todo estado de erro é tratado, com mensagem em português e botão de tentar de novo |
| Custo e complexidade de manter servidor | nenhum backend: só Hosting + Firestore + Storage + Auth, dentro da cota gratuita para o porte de um portfólio |

---

## 3. Atores envolvidos

### 3.1 Visitante (anônimo)

Quem vê o portfólio. Nunca autentica. Pode ler, **e apenas ler**, o que está
publicado: projetos com `status == 'published'`, seções com `visible == true` e o
documento `settings/site`. Qualquer outra leitura é negada pelas regras.

### 3.2 Designer / administrador (usuário único)

Dono do conteúdo. Autentica com e-mail e senha no Firebase Authentication. É o
**único UID** com permissão de escrita — o valor está fixado nas funções
`adminUid()` de `firestore.rules` e `storage.rules`. Não há papéis, convites,
níveis de permissão nem cadastro: quem entra, entra como dono.

> Não existe fluxo de "esqueci minha senha" na aplicação. A redefinição é feita
> no console do Firebase por quem administra o projeto.

### 3.3 Mantenedor técnico

Quem instala, publica regras, roda o seed e faz o deploy. Único a tocar em
código, terminal e console do Firebase.

### 3.4 Robôs de rede social

Leem o HTML cru ao gerar a prévia de um link compartilhado. Enxergam apenas as
metatags de `index.html` — nunca as tags por projeto (ver limitação em §7).

---

## 4. Funcionalidades centrais

### 4.1 Site público

- **Home** — nome, frase de destaque, projetos marcados como `featured` e a lista
  de seções visíveis.
- **Listagem `/projetos`** — todos os publicados, com filtro por seção no
  parâmetro de busca `?secao=<slug>` (validado por Zod na rota) e grade
  assimétrica.
- **Página do projeto `/projetos/$slug`** — capa, metadados (cliente · ano ·
  papel, os vazios simplesmente não aparecem), descrição com quebras de linha
  preservadas, galeria com lightbox (teclas ← → , Esc) e navegação
  anterior/próximo.
- **`/sobre`** — foto, bio, contato (e-mail, telefone, cidade, currículo) e redes.
- **404** — rota curinga com caminho de volta.
- **Tema claro/escuro** — alternado no rodapé, lembrado em `localStorage`,
  inicializado pela preferência do sistema.
- **Acessibilidade e desempenho** — imagens com `width`/`height` reais (sem
  layout shift), `alt` em tudo, itens da galeria como botões rotulados, animações
  respeitando `prefers-reduced-motion`.

### 4.2 Painel `/admin`

- **Login** (`/admin/login`) com erros do Firebase traduzidos para o designer.
- **Dashboard** — contagens de projetos, publicados, rascunhos e seções, mais
  atalhos.
- **Projetos** — dois modos deliberadamente separados:
  - *Lista*: tabela com busca por título, filtro por seção e status, ordenação e
    paginação (50 por página) — para **encontrar**;
  - *Reordenar*: arrastar para definir `order` — para decidir o que o **visitante
    vê primeiro**. Salva na hora, com update otimista.
- **Formulário de projeto** — título, slug gerado automaticamente (até ser
  editado à mão) com checagem assíncrona de duplicidade, seção, ano, cliente,
  papel, descrição, tags, capa, galeria com reordenação por arraste, destaque,
  pré-visualização, e as duas ações finais: **Salvar como rascunho** e
  **Publicar**.
- **Seções** — criar, renomear, descrever, ocultar (`visible`), reordenar e
  excluir com a proteção de projetos órfãos.
- **Configurações** — identidade (nome, headline, bio, foto), contato,
  redes sociais e compartilhamento.
- **Uploads** — arrastar ou escolher; barra de progresso real; cancelamento;
  legenda e texto alternativo por imagem, com aviso amarelo quando o `alt` está
  vazio; remover apaga o arquivo do Storage de verdade.

---

## 5. Principais fluxos de negócio

### 5.1 Montagem inicial do portfólio

```
criar seções  →  criar projetos dentro delas  →  publicar
```
O formulário de projeto detecta a ausência de seções e leva o designer a criar a
primeira antes de continuar.

### 5.2 Publicar um trabalho

```
Novo projeto → preencher → enviar capa e galeria → Pré-visualizar → Publicar
                                    ↓
                            Salvar como rascunho (continuar depois)
```
Regra de negócio: **projeto publicado exige imagem de capa**; rascunho não.
É o que permite salvar pela metade e voltar.

### 5.3 Tirar do ar sem perder

```
projeto publicado → Salvar como rascunho → some do site, permanece no painel
```
Excluir é o caminho definitivo: apaga documento **e** todas as imagens.

### 5.4 Reorganizar a vitrine

```
Projetos → aba Reordenar → arrastar → `order` regravado em lote (writeBatch)
```
Sempre sobre a lista completa, nunca sobre um recorte filtrado.

### 5.5 Reorganizar seções

```
Seções → arrastar (reordena) | chave "Visível no site" (oculta) | excluir
                                                                    ↓
                                          tem projetos? → mover todos para outra seção
```

### 5.6 Atualizar os textos do site

```
Configurações → Identidade / Contato / Redes / Compartilhamento → Salvar alterações
```
Campo vazio não aparece no site — a ausência é uma escolha editorial válida.

---

## 6. Visão de produto

**Princípios que o código expressa** e que devem guiar o que vier depois:

1. **A interface some, o trabalho aparece.** Paleta quase neutra, um acento
   terracota discreto, tipografia editorial (Bricolage Grotesque + Public Sans).
2. **O designer nunca vê jargão.** "Endereço no site" em vez de slug,
   "Texto alternativo" com explicação de para quê serve, erros de SDK traduzidos.
3. **Nada de tela branca.** Toda consulta tem carregamento, erro e vazio.
4. **Rascunho é um estado de primeira classe**, não um rascunho de mentira.
5. **Segurança por regra, não por interface.** Esconder um botão não protege
   nada; a regra do Firestore protege.
6. **Peso do bundle é decisão de produto.** A biblioteca de animação foi trocada
   por ~40 linhas de CSS e um IntersectionObserver (`useRevelar`), economizando
   119 kB do que o visitante baixa.
7. **Custo operacional próximo de zero.** Cada leitura conta na cota: daí o
   `staleTime` de 5 minutos e a consulta única que alimenta três telas.

---

## 7. Contexto operacional

| Aspecto | Situação |
|---|---|
| Hospedagem | Firebase Hosting, SPA com rewrite `**` → `/index.html` |
| Projeto Firebase | `portfolio-gqueiroz` (`.firebaserc`) |
| Firestore | região `southamerica-east1` (São Paulo) |
| Storage | bucket `portfolio-gqueiroz.firebasestorage.app`, criado em **US-EAST1** — imagens servidas dos EUA |
| Cache | assets versionados e fontes: 1 ano imutável; imagens: 7 dias; `index.html`: `no-cache` |
| Autenticação | e-mail/senha, um único usuário |
| Ambiente local | `.env.local` com as chaves `VITE_*`; emuladores opcionais (`VITE_USE_EMULATORS=1`, exigem JDK) |
| Conteúdo de exemplo | `npm run seed` — idempotente, autentica como admin e por isso também valida as regras |
| Idioma | tudo em português do Brasil |
| Público-alvo | clientes e contratantes do designer; **Hipótese** com base no idioma e na região escolhida: majoritariamente brasileiro |

**Limitação conhecida — prévia de link por projeto.** Compartilhar
`/projetos/<slug>` no WhatsApp, Instagram ou Facebook mostra o cartão padrão do
site, não a capa daquele projeto: as tags `og:` da rota são geradas por
JavaScript e os robôs leem apenas o HTML cru. Resolver exige prerender no build
ou uma Cloud Function na frente do Hosting — ambos fora do escopo atual.

**Lacunas funcionais registradas.** Os campos de *Compartilhamento*
(`seo.title`, `seo.description`, `seo.ogImage`) e as *tags* de projeto são
editáveis e persistidos, mas nenhuma tela pública os consome hoje. Detalhes e
implicações em [ARQUITETURA.md §8.2](ARQUITETURA.md#82-campos-gravados-que-o-site-nunca-lê).

---

## 8. Manutenção deste documento

Verificado por `scripts/docs-check.mjs` contra `src/lib/schemas.ts`,
`src/routes/` e os arquivos de regras — mudou o domínio, mudou o fluxo ou mudou
quem pode o quê, este documento precisa de revisão.

```bash
npm run docs:check
npm run docs:update -- docs/OBJETIVO.md
```
