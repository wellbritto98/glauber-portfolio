import type { ProjectStatus } from './schemas'

export interface FiltroProjetos {
  sectionId?: string
  status?: ProjectStatus | 'todos'
  busca?: string
}

/**
 * Todas as chaves de cache do TanStack Query em um único lugar.
 * Nenhuma string literal de query key deve existir fora deste arquivo —
 * é o que garante que uma invalidação atinja exatamente o que deveria.
 */
export const queryKeys = {
  sections: {
    all: ['sections'] as const,
    publicas: () => [...queryKeys.sections.all, 'publicas'] as const,
    admin: () => [...queryKeys.sections.all, 'admin'] as const,
  },
  projects: {
    all: ['projects'] as const,
    publicados: () => [...queryKeys.projects.all, 'publicados'] as const,
    porSlug: (slug: string) => [...queryKeys.projects.all, 'slug', slug] as const,
    admin: (filtro?: FiltroProjetos) =>
      [...queryKeys.projects.all, 'admin', filtro ?? {}] as const,
    porId: (id: string) => [...queryKeys.projects.all, 'id', id] as const,
    contagem: () => [...queryKeys.projects.all, 'contagem'] as const,
  },
  settings: {
    all: ['settings'] as const,
    site: () => [...queryKeys.settings.all, 'site'] as const,
  },
} as const
