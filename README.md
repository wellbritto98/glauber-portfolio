# Portfólio — site público + painel administrativo

Site de portfólio para designer gráfico, com painel administrativo próprio.
O designer gerencia seções, projetos, imagens, ordem e publicação sozinho,
sem tocar em código.

- **Site público** — vitrine editorial, responsiva, com modo escuro.
- **Painel** (`/admin`) — usuário único, protegido por login.

Sem backend próprio: tudo roda no navegador, e a segurança fica por conta das
regras do Firestore e do Storage.

## Documentação

Este arquivo cobre instalação, operação e o guia do painel. A documentação
técnica oficial — usada também como base para desenvolvimento assistido por
agentes de IA — está em:

- [`docs/OBJETIVO.md`](docs/OBJETIVO.md) — propósito, atores, fluxos de negócio;
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — padrões, regras, riscos, diretrizes;
- `README.md` dentro de cada módulo de `src/` e em `scripts/`;
- [`CLAUDE.md`](CLAUDE.md) — instruções operacionais para agentes.

A documentação é verificada por código: `npm run docs:check` mostra quais
documentos descrevem código que mudou desde a última revisão, e
`npm run docs:update -- <arquivo>` registra a revisão feita.

## Stack

React 19 · TypeScript 7 · Vite 8 · Tailwind CSS 4 · TanStack Router, Query,
Table e Form · shadcn/ui (só no painel) · Firebase (Firestore, Storage,
Authentication, Hosting).

As versões estão **fixadas** no `package.json`, sem `^`. Elas foram verificadas
compilando juntas. Ao atualizar qualquer uma, rode `npm run build` antes de
confiar no resultado.

---

## 1. Criar o projeto no Firebase Console

> Se o projeto `portfolio-gqueiroz` já existe e você só quer rodar o site,
> pule para o passo 3.

1. Acesse <https://console.firebase.google.com> e clique em **Adicionar projeto**.
2. Dê um nome, aceite os termos e conclua. O Google Analytics é opcional — este
   projeto não o utiliza.
3. **Firestore**: menu lateral → *Criar* → **Firestore Database** → *Criar banco
   de dados*. Escolha **`southamerica-east1` (São Paulo)** se o público for
   brasileiro. **A região não pode ser alterada depois.** Ao ser perguntado
   sobre as regras, escolha **modo bloqueado** (nunca modo de teste) — as regras
   corretas deste repositório serão publicadas no passo 5.
4. **Storage**: menu lateral → *Criar* → **Storage** → *Começar*. Exige o plano
   **Blaze** (cartão de crédito cadastrado). A cota gratuita cobre um portfólio
   com folga; o cartão só é cobrado se você ultrapassá-la.
5. **Authentication**: menu lateral → *Criar* → **Authentication** → *Vamos
   começar* → aba *Sign-in method* → habilite **E-mail/senha**.
6. **App web**: engrenagem (⚙) ao lado de *Visão geral do projeto* →
   *Configurações do projeto* → role até **Seus apps** → ícone `</>` → registre
   o app. Copie o objeto `firebaseConfig` que aparece: são os valores do passo 3
   abaixo.

## 2. Criar o usuário administrador e pegar o UID

Este é o único usuário que consegue escrever qualquer coisa.

1. **Authentication** → aba **Users** → **Adicionar usuário**.
2. Informe e-mail e senha (use uma senha forte — ela dá acesso total ao
   conteúdo do site).
3. Na linha do usuário criado, copie o valor da coluna **Identificador do
   usuário (User UID)**. É uma sequência tipo `a1B2c3D4e5F6g7H8i9J0kLmNoPqR`.
4. Cole esse UID nos **dois** arquivos de regras, substituindo o texto
   `SUBSTITUIR_PELO_UID_DO_ADMIN`:
   - `firestore.rules`, dentro da função `adminUid()`
   - `storage.rules`, dentro da função `adminUid()`
5. Publique as regras:
   ```bash
   npm run deploy:rules
   ```

> Enquanto o UID for o texto placeholder, **nenhuma escrita é permitida**. As
> regras falham fechadas de propósito: é o comportamento seguro, e o erro que
> você vê no painel (`permission-denied`) indica exatamente este passo pendente.

> **Atenção — os dois arquivos estão divergentes hoje.** `firestore.rules` usa
> `m6xE8kd3vpebcXgUT08qlbIeN8l2` e `storage.rules` usa
> `Cty5hwrChLVMBv7aPHtC4HhjBx42`. Como só um deles pode ser o UID real do
> usuário, um dos dois lados nega escrita: publicar um projeto com imagem falha
> em metade do fluxo. Confira o UID em **Authentication → Users**, alinhe os dois
> arquivos e republique com `npm run deploy:rules`.

## 3. Preencher o `.env.local`

Copie o modelo e preencha com os valores do `firebaseConfig`:

```bash
cp .env.example .env.local
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Usadas apenas pelo script de seed
SEED_ADMIN_EMAIL=email-do-admin@exemplo.com
SEED_ADMIN_PASSWORD=a-senha-do-admin
```

Esses valores `VITE_` não são segredo: eles vão para dentro do JavaScript que
qualquer visitante baixa, e é assim que o Firebase foi projetado. Quem protege
os dados são as regras do passo 2, não essas chaves.

O `.env.local` está no `.gitignore` mesmo assim, porque contém a senha do admin
usada pelo seed.

> **Nunca** coloque uma chave de *service account* (arquivo
> `*-adminsdk-*.json`) neste projeto. Ela ignora todas as regras de segurança e
> daria controle total a quem a obtivesse. O `.gitignore` já bloqueia esse
> padrão de nome como rede de proteção.

## 4. Comandos

```bash
npm install          # instalar dependências
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
npm run build        # checagem de tipos + build de produção
npm run preview      # servir o build localmente
npm run seed         # popular o Firestore com conteúdo de exemplo
npm run analyze      # build + relatório de bundle em stats.html
npm run emulators    # emuladores locais do Firebase
npm run deploy       # build + deploy completo
npm run deploy:rules # publicar só as regras e os índices
npm run docs:check   # documentação que precisa de revisão
npm run docs:update  # registrar documentação revisada
```

Os emuladores precisam de um JDK instalado:

```bash
sudo apt install -y openjdk-21-jre-headless
```

## 5. Conteúdo de exemplo

```bash
npm run seed
```

Cria 2 seções e 3 projetos publicados, com imagens geométricas de exemplo em
proporções variadas — o suficiente para conferir a grade e a página de projeto
antes de haver conteúdo real. O script é idempotente: rodar de novo atualiza os
mesmos registros em vez de duplicá-los.

Ele autentica com o usuário admin, então também funciona como teste prático das
regras: se o seed grava, as permissões estão corretas.

## 6. Deploy

```bash
npm run deploy
```

O `firebase.json` já está configurado para SPA (todas as rotas reescritas para
`index.html`) e com cache longo e imutável para os assets versionados, e
`no-cache` no `index.html`.

### Domínio próprio

O Firebase Hosting cuida de domínio customizado e certificado SSL sem custo:
**Hosting → Adicionar domínio personalizado**, e siga as instruções de DNS. O
certificado é emitido automaticamente em algumas horas.

---

## Limitação conhecida: Open Graph

Ao compartilhar o link de um projeto no WhatsApp, Instagram ou Facebook, **a
capa daquele projeto não aparece** — aparece a imagem padrão do site.

O motivo é estrutural: este é um site de página única, e as tags Open Graph de
cada projeto são geradas pelo JavaScript no navegador. Os robôs dessas redes
não executam JavaScript; eles leem o HTML cru, que é igual para todas as rotas.
Nenhuma biblioteca de meta tags resolve isso.

Para resolver de verdade seria preciso gerar HTML por projeto no build
(prerender) ou colocar uma Cloud Function na frente do Hosting para servir as
tags certas aos robôs. Ambos são acréscimos consideráveis e ficaram fora do
escopo atual.

O que está feito: `index.html` traz o título e a descrição padrão do site, então
qualquer link compartilhado mostra um cartão com o texto correto do portfólio —
só não específico do projeto. Ele **não** declara tags `og:` próprias, inclusive
`og:image`: a imagem que cada rede escolher vem do que ela encontrar na página.

---

## Estrutura

Cada diretório abaixo tem um `README.md` próprio, com objetivo, dependências,
fluxos, arquivos críticos e débitos identificados.

```
src/
  routes/            rotas em arquivos do TanStack Router
  components/site/   site público, escritos à mão com Tailwind
  components/admin/  painel
  components/ui/     shadcn — usados SOMENTE no painel
  hooks/             leitura e escrita, sempre via TanStack Query
  lib/
    schemas.ts       schemas Zod: fonte única dos tipos (z.infer)
    firebase.ts      app + Firestore (auth e storage entram sob demanda)
    auth.ts          SDK de autenticação por import dinâmico
    storage.ts       SDK de storage por import dinâmico
    upload.ts        compressão, miniatura, progresso, cancelamento, exclusão
    converters.ts    única camada Timestamp -> Date
    queryKeys.ts     todas as chaves de cache
scripts/
  seed.ts            conteúdo de exemplo
  docs-check.mjs     verificador de frescor da documentação
docs/                documentação técnica oficial (arquitetura e objetivo)
firestore.rules      leitura pública do publicado; escrita só do admin
storage.rules        leitura pública das imagens; escrita só do admin
```

Três decisões que não são óbvias no código:

1. **`admin_.login.tsx`**, com underline. O sufixo `_` faz a rota ter o caminho
   `/admin/login` sem herdar o layout de `admin.route.tsx`. Se herdasse, o guard
   redirecionaria para o login, que dispararia o guard de novo: laço infinito.
2. **`firebase/auth` e `firebase/storage` só entram por `await import()`.** As
   definições de rota do TanStack Router ficam na parte crítica do bundle, que
   não sofre code splitting — um import estático no guard levaria o SDK de
   autenticação para dentro do JavaScript que todo visitante do site baixa.
3. **Uma consulta só alimenta home, listagem e página de projeto.** Filtrar por
   seção em memória sai mais barato, em cota e em índices compostos, do que uma
   consulta por combinação de filtro. Um portfólio tem dezenas de projetos, não
   milhares.

---

## Estado da verificação

O que foi medido de fato, e o que não foi.

### Verificado

- **`npm run build` limpo** — checagem de tipos (TypeScript 7) e build de produção sem erros.
- **Regras de segurança, contra o projeto real.** Nove verificações como visitante
  anônimo: leitura de projetos publicados, seções visíveis e `settings/site`
  funcionam; listar todos os projetos, listar rascunhos, listar todas as seções,
  escrever projeto, escrever configurações e ler coleção não prevista são todas
  **negadas**. O seed grava autenticado como admin, o que valida o outro lado.
- **Code splitting.** O grafo de entrada do site público (10 chunks, **252 kB
  gzipado**) não contém TanStack Table, TanStack Form, dnd-kit, componentes do
  shadcn/Radix, nem o SDK de `firebase/auth` (126 kB, carregado sob demanda) ou
  de `firebase/storage`.
- **Contraste de cor (WCAG 2.1 AA).** Todos os tokens de texto passam de 4,5:1
  sobre o fundo, nos dois temas — o mais apertado é o `ink-faint` dos metadados,
  em 4,56:1 no claro e 4,59:1 no escuro.
- **Acessibilidade estrutural.** Landmarks corretos, todas as imagens com texto
  alternativo, itens da galeria como botões rotulados, navegação entre projetos
  rotulada, alternador de tema com rótulo descritivo.
- **Site no celular** (375 px) e **modo escuro**, conferidos visualmente. Com o
  tema escuro ativo no site, o painel `/admin` permanece claro, como projetado.

### NÃO verificado

- **Lighthouse não foi executado.** Ele precisa de um Chrome ou Chromium
  instalado, e não há nenhum nesta máquina. A meta de 90+ em Performance e
  Acessibilidade **não foi confirmada por medição**. O que dá para dizer com
  números é o peso da primeira carga: 252 kB gzipados, dos quais 133 kB são o
  SDK do Firestore — irredutível dentro da stack escolhida.

  Para medir, com o Chrome instalado:
  ```bash
  npm run build && npm run preview
  npx lighthouse http://localhost:4173 --view
  ```

## Uma observação sobre regiões

O Firestore está em **`southamerica-east1`** (São Paulo), mas o bucket padrão do
Storage foi criado em **`US-EAST1`**. As imagens são servidas dos Estados Unidos,
o que acrescenta latência para visitantes brasileiros.

A localização de um bucket não muda depois de criado. Se isso incomodar, dá para
criar um bucket adicional em São Paulo e apontar o `VITE_FIREBASE_STORAGE_BUCKET`
para ele — mas só vale a pena antes de haver muita imagem publicada, porque as
já existentes precisariam ser migradas.

---

# Guia do painel — para o Glauber

Este guia não tem nada de técnico. É o passo a passo de como cuidar do seu
site sozinho.

## Como entrar

Abra `seu-site.com.br/admin/login`, coloque seu e-mail e sua senha. Pronto.
O site lembra que você entrou, então normalmente você só faz isso uma vez.

Para sair, use o botão **Sair**, lá embaixo no menu da esquerda.

## Como o site é organizado

Duas ideias, só:

- **Seções** são as gavetas: "Identidade Visual", "Editorial", "Embalagem".
  Cada projeto mora dentro de uma seção.
- **Projetos** são os trabalhos em si, com capa, textos e galeria de imagens.

Crie as seções primeiro. Depois vá enchendo de projeto.

## Publicar um projeto novo

1. No menu, clique em **Projetos** e depois no botão **Novo projeto**.
2. Preencha o **Título**. O "Endereço no site" se preenche sozinho a partir do
   título — só mexa nele se tiver um bom motivo.
3. Escolha a **Seção**.
4. Preencha **Ano**, e se quiser **Cliente** e **Papel** (ex.: "Direção de arte,
   ilustração"). Cliente e Papel são opcionais: se deixar em branco, eles
   simplesmente não aparecem no site.
5. Escreva a **Descrição**. Pode usar quantos parágrafos quiser — as quebras de
   linha aparecem no site do jeito que você digitou.
6. Arraste a **imagem de capa** para a área indicada, ou clique para escolher um
   arquivo.
7. Na **Galeria**, arraste várias imagens de uma vez. Elas sobem uma de cada vez,
   com uma barrinha mostrando o progresso de cada uma.
8. Quando estiver satisfeito, clique em **Publicar**.

Se quiser parar no meio e continuar depois, clique em **Salvar como rascunho**.
Rascunho fica guardado no painel e **não aparece no site** para ninguém.

> Antes de publicar, vale clicar em **Pré-visualizar** para conferir como ficou.

## Sobre as imagens

- **Pode mandar arquivo grande.** O site reduz e otimiza automaticamente antes
  de enviar. Você não precisa exportar em tamanho especial.
- O limite é **10 MB por arquivo**. Se passar disso, aparece um aviso pedindo
  para exportar menor.
- **Reordenar a galeria**: arraste as imagens para a posição que quiser.
- **Legenda** é o textinho que aparece embaixo da imagem no site. Opcional.
- **Texto alternativo** é a descrição da imagem para quem não enxerga e usa
  leitor de tela. Quando estiver vazio, aparece um aviso amarelo. Vale a pena
  preencher: além de ser mais gentil, ajuda o Google a entender seu trabalho.

## Mudar a ordem dos projetos no site

Em **Projetos**, troque de **Lista** para **Reordenar**. Aí é só arrastar os
projetos para a ordem que você quiser. Ela é salva na hora.

São duas telas separadas de propósito: na Lista você organiza a tabela do jeito
que for melhor para *encontrar* as coisas; em Reordenar você define a ordem que
o *visitante* vai ver.

## Tirar um projeto do ar

Você não precisa excluir. Abra o projeto e clique em **Salvar como rascunho** —
ele some do site na hora, mas continua guardadinho no painel, com todas as
imagens. Dá para republicar quando quiser.

**Excluir** é definitivo: apaga o projeto e todas as imagens dele. Não tem como
desfazer, e o painel pede confirmação antes.

## Seções

Em **Seções** você cria, renomeia e reordena as gavetas.

- A chavinha **Visível no site** esconde uma seção sem apagar nada. Útil quando
  você está montando uma categoria nova e ainda não quer mostrar.
- **Não dá para excluir uma seção que ainda tem projetos.** O painel avisa
  quantos são e oferece mover todos para outra seção antes. Isso é de propósito:
  evita que projetos fiquem órfãos sem você perceber.

## Textos do site

Em **Configurações** você muda tudo que não é projeto:

- **Identidade** — seu nome, a frase grande da página inicial, e o texto da
  página "Sobre", mais sua foto.
- **Contato** — e-mail, telefone, cidade e link do currículo em PDF. O que
  estiver em branco não aparece no site.
- **Redes sociais** — adicione quantas quiser. O endereço precisa ser o link
  completo, começando com `https://`.
- **Compartilhamento** — o título, a descrição e a imagem que aparecem quando
  alguém manda o link do seu site no WhatsApp ou no Instagram.

Não esqueça de clicar em **Salvar alterações** no fim.

## Perguntas que costumam aparecer

**Publiquei e não apareceu no site.**
Atualize a página do site. O site guarda o conteúdo por alguns minutos para
carregar mais rápido, então às vezes leva um instante.

**Mandei a imagem errada.**
Clique em **Remover imagem** e mande a certa. A errada é apagada de verdade.

**Esqueci minha senha.**
Quem cuida do site consegue redefinir no painel do Firebase. Não existe
"esqueci minha senha" nesta tela.

**Posso entrar pelo celular?**
Pode, mas o painel foi pensado para telas maiores. Publicar um projeto com
galeria grande é bem mais confortável no computador.
