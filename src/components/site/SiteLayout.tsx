import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useTheme, type Tema } from '@/hooks/useTheme'
import type { SiteSettingsInput } from '@/lib/schemas'

interface SiteLayoutProps {
  children: ReactNode
}

const classeLinkNav =
  'font-body text-sm uppercase tracking-wider text-ink-muted transition-colors hover:text-ink'
const classeLinkNavAtivo = 'text-ink'

/**
 * Casca compartilhada do site público: cabeçalho, rodapé e o wrapper que
 * recebe a classe `.dark`. Essa classe NUNCA vai no `<html>` — só aqui,
 * neste wrapper — para o painel admin (shadcn, utilitários `dark:`) nunca
 * herdar o tema escuro do site.
 */
export function SiteLayout({ children }: SiteLayoutProps) {
  const { tema, alternar } = useTheme()
  const { data: settings } = useSiteSettings()
  const nome = settings?.ownerName || 'Portfólio'

  return (
    <div className={tema === 'dark' ? 'dark' : undefined}>
      <div className="flex min-h-screen flex-col bg-paper text-ink">
        <header className="border-b border-rule">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <Link to="/" className="font-display text-lg font-bold tracking-tight text-ink">
              {nome}
            </Link>
            <nav className="flex items-center gap-8">
              <Link to="/projetos" className={classeLinkNav} activeProps={{ className: classeLinkNavAtivo }}>
                Projetos
              </Link>
              <Link to="/sobre" className={classeLinkNav} activeProps={{ className: classeLinkNavAtivo }}>
                Sobre
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <Rodape settings={settings} tema={tema} aoAlternarTema={alternar} />
      </div>
    </div>
  )
}

function Rodape({
  settings,
  tema,
  aoAlternarTema,
}: {
  settings: SiteSettingsInput | undefined
  tema: Tema
  aoAlternarTema: () => void
}) {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {settings?.email && (
            <a
              href={`mailto:${settings.email}`}
              className="font-body text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {settings.email}
            </a>
          )}
          {settings?.socials.map((rede) => (
            <a
              key={rede.platform}
              href={rede.url}
              target="_blank"
              rel="noreferrer"
              className="font-body text-sm uppercase tracking-wider text-ink-muted transition-colors hover:text-ink"
            >
              {rede.platform}
            </a>
          ))}
          <span className="font-body text-sm text-ink-faint">
            © {new Date().getFullYear()}
          </span>
        </div>
        <button
          type="button"
          onClick={aoAlternarTema}
          aria-label={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted transition-colors hover:text-ink"
        >
          {tema === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>
      </div>
    </footer>
  )
}
