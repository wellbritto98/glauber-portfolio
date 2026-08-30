/**
 * Popula o Firestore com 2 seções e 3 projetos de exemplo, para conferir o
 * layout antes de existir conteúdo real.
 *
 * Roda direto no Node (v22+), sem tsx e sem firebase-admin:
 *   npm run seed
 *
 * Autentica com o usuário admin do Authentication, então também serve de
 * teste prático das regras de segurança — se as regras estiverem erradas,
 * este script falha.
 */

import { initializeApp } from 'firebase/app'
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

process.loadEnvFile('.env.local')

const env = (chave: string): string => {
  const valor = process.env[chave]
  if (!valor) {
    console.error(`\n✖ Falta ${chave} no .env.local\n`)
    process.exit(1)
  }
  return valor
}

const app = initializeApp({
  apiKey: env('VITE_FIREBASE_API_KEY'),
  authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: env('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: env('VITE_FIREBASE_APP_ID'),
})

const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// ---------------------------------------------------------------------------
// Imagens de exemplo
//
// Blocos SVG geométricos na paleta do site. Não são fotos, mas têm as
// proporções certas — que é o que a grade assimétrica precisa exercitar.
// ---------------------------------------------------------------------------

const PALETAS = [
  ['#1f1b17', '#c2703d', '#e8e2d9'],
  ['#243027', '#7d9b76', '#eceee7'],
  ['#1b1f2a', '#5b6f9c', '#e6e9ef'],
  ['#2b1f24', '#a8657b', '#efe6e9'],
  ['#22201a', '#b8a06a', '#eeebe2'],
]

function svgDeExemplo(largura: number, altura: number, indice: number, rotulo: string): string {
  const [fundo, acento, claro] = PALETAS[indice % PALETAS.length]
  const u = Math.min(largura, altura) / 12
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">
  <rect width="${largura}" height="${altura}" fill="${fundo}"/>
  <circle cx="${largura * 0.68}" cy="${altura * 0.32}" r="${u * 2.6}" fill="${acento}"/>
  <rect x="${u}" y="${altura - u * 4}" width="${largura - u * 2}" height="${u * 0.5}" fill="${claro}" opacity="0.9"/>
  <rect x="${u}" y="${altura - u * 2.6}" width="${largura * 0.42}" height="${u * 0.32}" fill="${claro}" opacity="0.55"/>
  <text x="${u}" y="${u * 2.4}" font-family="Helvetica, Arial, sans-serif" font-size="${u * 0.72}" font-weight="700" fill="${claro}" opacity="0.92">${rotulo}</text>
</svg>`
}

async function enviarSvg(
  caminho: string,
  largura: number,
  altura: number,
  indice: number,
  rotulo: string,
) {
  const conteudo = new TextEncoder().encode(svgDeExemplo(largura, altura, indice, rotulo))
  const referencia = ref(storage, caminho)
  await uploadBytes(referencia, conteudo, {
    contentType: 'image/svg+xml',
    cacheControl: 'public, max-age=31536000, immutable',
  })
  const url = await getDownloadURL(referencia)
  return { url, path: caminho, thumbUrl: url, thumbPath: caminho, width: largura, height: altura }
}

// ---------------------------------------------------------------------------
// Conteúdo de exemplo
// ---------------------------------------------------------------------------

const SECOES = [
  {
    slug: 'identidade-visual',
    name: 'Identidade Visual',
    description: 'Marcas construídas do símbolo ao manual de aplicação.',
    order: 0,
    visible: true,
  },
  {
    slug: 'editorial',
    name: 'Editorial',
    description: 'Livros, revistas e catálogos — projeto gráfico e diagramação.',
    order: 1,
    visible: true,
  },
]

const PROJETOS = [
  {
    slug: 'cafe-serra-alta',
    title: 'Café Serra Alta',
    secao: 'identidade-visual',
    year: '2025',
    client: 'Serra Alta Torrefação',
    role: 'Direção de arte, identidade, embalagem',
    description:
      'Identidade para uma torrefação de café de montanha.\n\nO símbolo parte da curva das serras e da linha do vapor, resolvido num traço só. A paleta é terrosa e a tipografia tem peso, para funcionar impressa em papel kraft sem perder presença na prateleira.',
    tags: ['identidade', 'embalagem', 'tipografia'],
    featured: true,
    proporcoes: [
      [1600, 1200],
      [1200, 1500],
      [1600, 900],
    ],
  },
  {
    slug: 'revista-margem',
    title: 'Revista Margem',
    secao: 'editorial',
    year: '2024',
    client: 'Coletivo Margem',
    role: 'Projeto gráfico, diagramação',
    description:
      'Projeto gráfico de uma revista independente de ensaios e fotografia.\n\nA grade de quatro colunas quebra propositalmente nas aberturas de matéria, e o miolo alterna papel pólen e couché para separar ensaio de portfólio fotográfico.',
    tags: ['editorial', 'grade', 'impresso'],
    featured: true,
    proporcoes: [
      [1400, 1750],
      [1600, 1067],
    ],
  },
  {
    slug: 'instituto-raiz',
    title: 'Instituto Raiz',
    secao: 'identidade-visual',
    year: '2024',
    client: 'Instituto Raiz',
    role: 'Identidade, sistema de sinalização',
    description:
      'Identidade e sinalização para um instituto de agricultura urbana.\n\nO sistema usa um módulo quadrado que se repete em placas, cartazes e canteiros, e uma paleta de verdes dessaturados que envelhece bem ao sol.',
    tags: ['identidade', 'sinalização'],
    featured: false,
    proporcoes: [
      [1600, 1200],
      [1200, 1200],
      [1600, 900],
      [1200, 1500],
    ],
  },
]

// ---------------------------------------------------------------------------

async function main() {
  const email = env('SEED_ADMIN_EMAIL')
  const senha = env('SEED_ADMIN_PASSWORD')

  console.log(`\nEntrando como ${email}...`)
  const credencial = await signInWithEmailAndPassword(auth, email, senha)
  console.log(`✔ autenticado — UID ${credencial.user.uid}`)
  console.log('  (é este UID que precisa estar em firestore.rules e storage.rules)\n')

  // --- seções ---
  const idsDasSecoes = new Map<string, string>()
  const secoesExistentes = await getDocs(collection(db, 'sections'))
  const porSlug = new Map(secoesExistentes.docs.map((d) => [d.data().slug, d.id]))

  const lote = writeBatch(db)
  for (const secao of SECOES) {
    const id = porSlug.get(secao.slug) ?? doc(collection(db, 'sections')).id
    idsDasSecoes.set(secao.slug, id)
    lote.set(doc(db, 'sections', id), { ...secao, createdAt: serverTimestamp() }, { merge: true })
    console.log(`  seção: ${secao.name}`)
  }
  await lote.commit()
  console.log('✔ seções gravadas\n')

  // --- projetos ---
  const projetosExistentes = await getDocs(collection(db, 'projects'))
  const projetoPorSlug = new Map(projetosExistentes.docs.map((d) => [d.data().slug, d.id]))

  let ordem = 0
  let indiceCor = 0
  for (const projeto of PROJETOS) {
    const id = projetoPorSlug.get(projeto.slug) ?? doc(collection(db, 'projects')).id
    console.log(`  projeto: ${projeto.title}`)

    const [capaL, capaA] = projeto.proporcoes[0]
    const capa = await enviarSvg(
      `projects/${id}/capa.svg`,
      capaL,
      capaA,
      indiceCor++,
      projeto.title.toUpperCase(),
    )

    const galeria = []
    for (let i = 0; i < projeto.proporcoes.length; i++) {
      const [l, a] = projeto.proporcoes[i]
      const img = await enviarSvg(
        `projects/${id}/galeria-${i}.svg`,
        l,
        a,
        indiceCor++,
        `${i + 1}/${projeto.proporcoes.length}`,
      )
      galeria.push({
        ...img,
        alt: `${projeto.title} — imagem ${i + 1}`,
        caption: '',
        order: i,
      })
    }
    console.log(`    ${galeria.length + 1} imagens enviadas`)

    await setDoc(
      doc(db, 'projects', id),
      {
        title: projeto.title,
        slug: projeto.slug,
        sectionId: idsDasSecoes.get(projeto.secao),
        year: projeto.year,
        client: projeto.client,
        role: projeto.role,
        description: projeto.description,
        coverImage: { ...capa, alt: `Capa do projeto ${projeto.title}` },
        gallery: galeria,
        tags: projeto.tags,
        featured: projeto.featured,
        status: 'published',
        order: ordem++,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
  console.log('\n✔ projetos gravados')

  // --- configurações do site ---
  await setDoc(
    doc(db, 'settings', 'site'),
    {
      ownerName: 'Glauber Queiroz',
      headline: 'Identidade visual e projeto gráfico para marcas que precisam de presença.',
      bio: 'Sou designer gráfico e trabalho com identidade visual, editorial e sinalização.\n\nEste texto é de exemplo — troque por sua bio no painel, em Configurações.',
      profileImage: null,
      email: '',
      phone: '',
      location: 'Brasil',
      socials: [],
      resumeUrl: '',
      seo: {
        title: 'Glauber Queiroz — Design gráfico',
        description: 'Portfólio de identidade visual, editorial e sinalização.',
        ogImage: null,
      },
    },
    { merge: true },
  )
  console.log('✔ configurações do site gravadas')

  console.log('\nPronto. Rode `npm run dev` e abra http://localhost:5173\n')
  process.exit(0)
}

main().catch((erro) => {
  console.error('\n✖ O seed falhou:', erro?.code ?? '', erro?.message ?? erro)
  if (erro?.code === 'permission-denied' || erro?.code === 'storage/unauthorized') {
    console.error(
      '\n  Isso quase sempre significa que o UID em firestore.rules / storage.rules\n' +
        '  ainda é o placeholder. Coloque o UID mostrado acima nos dois arquivos e rode:\n' +
        '    npm run deploy:rules\n',
    )
  }
  process.exit(1)
})
