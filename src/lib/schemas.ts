import { z } from 'zod'

/**
 * Fonte única de verdade dos tipos do domínio.
 *
 * Cada entidade tem dois schemas:
 *  - `xInput`  — o que os formulários produzem e o que gravamos no Firestore
 *  - `x`       — a entidade já lida do Firestore (com id e datas convertidas)
 *
 * Os tipos TypeScript saem daqui via z.infer. Não existe `interface` paralela:
 * duas declarações do mesmo formato divergem com o tempo.
 */

// ---------------------------------------------------------------------------
// Imagens
// ---------------------------------------------------------------------------

/** Uma imagem já enviada ao Storage. `path` é o que permite apagar o arquivo. */
export const storedImageSchema = z.object({
  url: z.url(),
  path: z.string().min(1),
  /** Versão 600px usada nas grades. Ausente em imagens antigas. */
  thumbUrl: z.url().optional(),
  thumbPath: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().default(''),
})
export type StoredImage = z.infer<typeof storedImageSchema>

export const galleryImageSchema = storedImageSchema.extend({
  caption: z.string().default(''),
  order: z.number().int().nonnegative(),
})
export type GalleryImage = z.infer<typeof galleryImageSchema>

/** Imagem simples, sem dimensões — usada na foto de perfil e no OG. */
export const simpleImageSchema = z.object({
  url: z.url(),
  path: z.string().min(1),
})
export type SimpleImage = z.infer<typeof simpleImageSchema>

// ---------------------------------------------------------------------------
// Seções
// ---------------------------------------------------------------------------

export const sectionInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Dê um nome para a seção.' })
    .max(60, { error: 'O nome deve ter no máximo 60 caracteres.' }),
  slug: z
    .string()
    .trim()
    .min(1, { error: 'O endereço da seção não pode ficar vazio.' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: 'Use apenas letras minúsculas, números e hífens.',
    }),
  description: z.string().default(''),
  order: z.number().int().nonnegative().default(0),
  visible: z.boolean().default(true),
})
export type SectionInput = z.infer<typeof sectionInputSchema>

export const sectionSchema = sectionInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.date().nullable().default(null),
})
export type Section = z.infer<typeof sectionSchema>

// ---------------------------------------------------------------------------
// Projetos
// ---------------------------------------------------------------------------

export const projectStatusSchema = z.enum(['draft', 'published'])
export type ProjectStatus = z.infer<typeof projectStatusSchema>

export const projectInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'Dê um título ao projeto.' })
    .max(120, { error: 'O título deve ter no máximo 120 caracteres.' }),
  slug: z
    .string()
    .trim()
    .min(1, { error: 'O endereço do projeto não pode ficar vazio.' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: 'Use apenas letras minúsculas, números e hífens.',
    }),
  sectionId: z.string().min(1, { error: 'Escolha uma seção.' }),
  year: z
    .string()
    .trim()
    .regex(/^\d{4}$/, { error: 'Informe o ano com 4 dígitos, ex: 2025.' }),
  client: z.string().default(''),
  role: z.string().default(''),
  description: z.string().default(''),
  coverImage: storedImageSchema.nullable().default(null),
  gallery: z.array(galleryImageSchema).default([]),
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  status: projectStatusSchema.default('draft'),
  order: z.number().int().nonnegative().default(0),
})
export type ProjectInput = z.infer<typeof projectInputSchema>

/**
 * Publicar exige capa. Rascunho não — o designer precisa poder salvar
 * um projeto pela metade e voltar depois.
 */
export const publishableProjectSchema = projectInputSchema.refine(
  (p) => p.status !== 'published' || p.coverImage !== null,
  { error: 'Um projeto publicado precisa de imagem de capa.', path: ['coverImage'] },
)

export const projectSchema = projectInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.date().nullable().default(null),
  updatedAt: z.date().nullable().default(null),
})
export type Project = z.infer<typeof projectSchema>

// ---------------------------------------------------------------------------
// Configurações do site (documento único settings/site)
// ---------------------------------------------------------------------------

export const socialSchema = z.object({
  platform: z.string().trim().min(1, { error: 'Informe a rede.' }),
  url: z.url({ error: 'Informe um endereço válido, começando com https://' }),
})
export type Social = z.infer<typeof socialSchema>

export const siteSettingsInputSchema = z.object({
  ownerName: z.string().trim().default(''),
  headline: z.string().default(''),
  bio: z.string().default(''),
  profileImage: simpleImageSchema.nullable().default(null),
  email: z.union([z.email({ error: 'E-mail inválido.' }), z.literal('')]).default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  socials: z.array(socialSchema).default([]),
  resumeUrl: z.union([z.url({ error: 'Endereço inválido.' }), z.literal('')]).default(''),
  seo: z
    .object({
      title: z.string().default(''),
      description: z.string().default(''),
      ogImage: simpleImageSchema.nullable().default(null),
    })
    .default({ title: '', description: '', ogImage: null }),
})
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>
export type SiteSettings = SiteSettingsInput
