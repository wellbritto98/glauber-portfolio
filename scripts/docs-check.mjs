#!/usr/bin/env node
/**
 * Verificador de frescor da documentação.
 *
 * Cada documento deste repositório declara abaixo QUAIS arquivos ele descreve.
 * O script calcula um hash do conteúdo desses arquivos e compara com o valor
 * gravado em `docs/.docs-manifest.json`. Se o código mudou e o documento não
 * foi revisado, o documento aparece como DESATUALIZADO.
 *
 * Não há mágica: o hash não sabe se o texto está certo, só sabe que o código
 * que ele descreve mudou desde a última revisão registrada. Quem decide se o
 * texto continua verdadeiro é quem revisa — o script só garante que ninguém
 * esqueça de olhar.
 *
 * Uso:
 *   node scripts/docs-check.mjs            # relatório legível; sai 1 se houver stale
 *   node scripts/docs-check.mjs --json     # mesmo relatório em JSON
 *   node scripts/docs-check.mjs --hook     # saída para o hook Stop do Claude Code
 *   node scripts/docs-check.mjs --update   # marca TODOS como revisados
 *   node scripts/docs-check.mjs --update docs/ARQUITETURA.md src/lib/README.md
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MANIFESTO = path.join(RAIZ, 'docs', '.docs-manifest.json')

/**
 * O mapa oficial documento -> código descrito.
 *
 * Ao criar um documento novo, ou ao mover código de lugar, ATUALIZE ESTE MAPA.
 * Um documento fora daqui não é verificado por ninguém e apodrece em silêncio.
 */
const AREAS = [
  {
    doc: 'CLAUDE.md',
    descricao: 'Instruções operacionais para agentes de IA',
    fontes: ['package.json', 'vite.config.ts', 'tsconfig.json', 'components.json', 'firebase.json'],
  },
  {
    doc: 'docs/ARQUITETURA.md',
    descricao: 'Visão arquitetural, padrões e regras do sistema',
    fontes: [
      'src',
      'scripts/seed.ts',
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'firebase.json',
      'firestore.rules',
      'storage.rules',
      'firestore.indexes.json',
      'index.html',
    ],
  },
  {
    doc: 'docs/OBJETIVO.md',
    descricao: 'Propósito, atores e fluxos de negócio',
    fontes: ['src/lib/schemas.ts', 'src/routes', 'firestore.rules', 'storage.rules'],
  },
  {
    doc: 'README.md',
    descricao: 'Guia de instalação, operação e uso do painel',
    fontes: ['package.json', 'firebase.json', 'firestore.rules', 'storage.rules', '.env.example'],
  },
  { doc: 'src/README.md', descricao: 'Mapa da aplicação', fontes: ['src/main.tsx', 'src/router.tsx'] },
  { doc: 'src/routes/README.md', descricao: 'Rotas e guards', fontes: ['src/routes'] },
  { doc: 'src/lib/README.md', descricao: 'Núcleo compartilhado', fontes: ['src/lib'] },
  { doc: 'src/hooks/README.md', descricao: 'Acesso a dados e estado', fontes: ['src/hooks'] },
  {
    doc: 'src/components/README.md',
    descricao: 'Fronteira entre as três famílias de componentes',
    fontes: ['src/components/site', 'src/components/admin', 'src/components/ui'],
    profundidade: 1,
  },
  { doc: 'src/components/site/README.md', descricao: 'Componentes do site público', fontes: ['src/components/site'] },
  { doc: 'src/components/admin/README.md', descricao: 'Componentes do painel', fontes: ['src/components/admin'] },
  { doc: 'src/components/ui/README.md', descricao: 'Primitivos shadcn/ui', fontes: ['src/components/ui'] },
  { doc: 'src/styles/README.md', descricao: 'Tokens de tema e animações', fontes: ['src/styles'] },
  { doc: 'scripts/README.md', descricao: 'Scripts de apoio', fontes: ['scripts'] },
]

/** Arquivos que nunca contam como mudança de código descrita. */
const IGNORADOS = new Set(['README.md', 'routeTree.gen.ts', '.docs-manifest.json'])
const EXTENSOES = new Set(['.ts', '.tsx', '.css', '.json', '.rules', '.html', '.mjs', '.example'])

function relevante(arquivo) {
  const base = path.basename(arquivo)
  if (IGNORADOS.has(base)) return false
  if (base === '.env.example') return true
  return EXTENSOES.has(path.extname(arquivo))
}

/** Lista os arquivos de uma fonte (arquivo solto ou diretório). */
function listar(fonte, profundidade = Infinity, nivel = 0) {
  const absoluto = path.join(RAIZ, fonte)
  if (!existsSync(absoluto)) return []
  if (statSync(absoluto).isFile()) return relevante(absoluto) ? [fonte] : []

  const encontrados = []
  for (const entrada of readdirSync(absoluto, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const filho = path.posix.join(fonte, entrada.name)
    if (entrada.isDirectory()) {
      if (nivel + 1 < profundidade) encontrados.push(...listar(filho, profundidade, nivel + 1))
    } else if (relevante(entrada.name)) {
      encontrados.push(filho)
    }
  }
  return encontrados
}

/** Hash do conteúdo de todos os arquivos descritos por um documento. */
function hashDaArea(area) {
  const soma = createHash('sha256')
  const arquivos = area.fontes.flatMap((fonte) => listar(fonte, area.profundidade ?? Infinity)).sort()
  for (const arquivo of arquivos) {
    soma.update(arquivo)
    soma.update(readFileSync(path.join(RAIZ, arquivo)))
  }
  return { hash: soma.digest('hex').slice(0, 16), arquivos: arquivos.length }
}

function lerManifesto() {
  if (!existsSync(MANIFESTO)) return { versao: 1, documentos: {} }
  try {
    return JSON.parse(readFileSync(MANIFESTO, 'utf8'))
  } catch {
    return { versao: 1, documentos: {} }
  }
}

function avaliar() {
  const manifesto = lerManifesto()
  return AREAS.map((area) => {
    const { hash, arquivos } = hashDaArea(area)
    const registro = manifesto.documentos[area.doc]
    const existe = existsSync(path.join(RAIZ, area.doc))
    let estado = 'ok'
    if (!existe) estado = 'ausente'
    else if (!registro) estado = 'nunca-revisado'
    else if (registro.hash !== hash) estado = 'desatualizado'
    return { ...area, hash, arquivos, estado, revisadoEm: registro?.revisadoEm ?? null }
  })
}

function gravar(resultados, alvos) {
  const manifesto = lerManifesto()
  manifesto.versao = 1
  manifesto.documentos ??= {}
  const agora = new Date().toISOString()
  let gravados = 0
  for (const r of resultados) {
    if (alvos.length > 0 && !alvos.includes(r.doc)) continue
    if (r.estado === 'ausente') continue
    manifesto.documentos[r.doc] = { hash: r.hash, arquivos: r.arquivos, revisadoEm: agora }
    gravados += 1
  }
  // Remove documentos que saíram do mapa de AREAS.
  const conhecidos = new Set(AREAS.map((a) => a.doc))
  for (const doc of Object.keys(manifesto.documentos)) {
    if (!conhecidos.has(doc)) delete manifesto.documentos[doc]
  }
  writeFileSync(MANIFESTO, `${JSON.stringify(manifesto, null, 2)}\n`)
  return gravados
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const resultados = avaliar()
const pendentes = resultados.filter((r) => r.estado !== 'ok')

if (args.includes('--update')) {
  const alvos = args.filter((a) => !a.startsWith('--'))
  const n = gravar(resultados, alvos)
  console.log(`docs-check: ${n} documento(s) marcados como revisados em docs/.docs-manifest.json`)
  process.exit(0)
}

if (args.includes('--hook')) {
  // Saída consumida pelo hook Stop do Claude Code: apenas avisa, nunca bloqueia.
  if (pendentes.length === 0) process.exit(0)
  const mostrados = pendentes.slice(0, 5).map((r) => r.doc)
  const resto = pendentes.length - mostrados.length
  const lista = mostrados.join(', ') + (resto > 0 ? ` e mais ${resto}` : '')
  process.stdout.write(
    JSON.stringify({
      systemMessage:
        `📚 Documentação possivelmente defasada: ${lista}. ` +
        'Rode /docs-sync (ou `npm run docs:check`) para revisar e atualizar.',
      suppressOutput: true,
    }),
  )
  process.exit(0)
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ pendentes: pendentes.length, documentos: resultados }, null, 2))
  process.exit(pendentes.length > 0 ? 1 : 0)
}

const rotulo = { ok: '  ok        ', ausente: '  AUSENTE   ', 'nunca-revisado': '  NOVO      ', desatualizado: '  DEFASADO  ' }
console.log('\nFrescor da documentação\n')
for (const r of resultados) {
  console.log(`${rotulo[r.estado]}${r.doc}  (${r.arquivos} arquivos descritos)`)
}
if (pendentes.length === 0) {
  console.log('\nTudo em dia.\n')
  process.exit(0)
}
console.log(
  `\n${pendentes.length} documento(s) precisam de revisão.` +
    '\nRevise o texto contra o código e então registre a revisão:' +
    `\n  node scripts/docs-check.mjs --update ${pendentes.map((r) => r.doc).join(' ')}\n`,
)
process.exit(1)
