import { useEffect, useState } from 'react'
import { createFileRoute, Outlet, redirect, isRedirect, Link, useNavigate, useRouterState } from '@tanstack/react-router'
import type { User } from 'firebase/auth'
import { ensureAuth, getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { LayoutDashboard, FolderKanban, Layers, Settings, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ location }) => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw redirect({ to: '/admin/login', search: { redirect: location.href } })
      }
    } catch (erro) {
      // Redirecionamentos precisam continuar subindo — só falhas reais de
      // autenticação (rede fora do ar, etc.) caem no catch.
      if (isRedirect(erro)) throw erro
      throw redirect({ to: '/admin/login', search: { redirect: location.href } })
    }
  },
  component: AdminLayout,
})

const NAV_ITEMS = [
  { to: '/admin', label: 'Painel', icon: LayoutDashboard },
  { to: '/admin/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/admin/secoes', label: 'Seções', icon: Layers },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
] as const

function AdminLayout() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    let unsub: (() => void) | undefined
    let ativo = true
    ensureAuth().then(({ onChange, auth }) => {
      if (!ativo) return
      setUser(auth.currentUser)
      unsub = onChange(setUser)
    })
    return () => {
      ativo = false
      unsub?.()
    }
  }, [])

  async function handleSignOut() {
    const { signOut } = await ensureAuth()
    await signOut()
    navigate({ to: '/admin/login' })
  }

  return (
    <div className="light flex min-h-screen bg-background text-foreground">
      <Toaster />
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="px-4 py-4">
          <p className="font-heading text-sm font-semibold">Painel do portfólio</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const ativo = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground',
                  ativo && 'bg-muted text-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t px-2 py-3">
          <div className="mb-2 truncate px-1 text-xs text-muted-foreground">
            {user ? user.email : <Loader2 className="size-3.5 animate-spin" />}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="size-3.5" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-hidden p-6">
        <Outlet />
      </main>
    </div>
  )
}
