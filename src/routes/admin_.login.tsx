import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { FirebaseError } from 'firebase/app'
import { ensureAuth, mensagemDeErroDeLogin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/admin_/login')({
  validateSearch: (search) => loginSearchSchema.parse(search),
  component: AdminLogin,
})

function AdminLogin() {
  const navigate = useNavigate()
  const { redirect } = Route.useSearch()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { signIn } = await ensureAuth()
      await signIn(email, senha)
      if (redirect) {
        navigate({ href: redirect })
      } else {
        navigate({ to: '/admin' })
      }
    } catch (e) {
      const codigo = e instanceof FirebaseError ? e.code : 'desconhecido'
      setErro(mensagemDeErroDeLogin(codigo))
      setEnviando(false)
    }
  }

  return (
    <div className="light flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-lg font-semibold">Painel do portfólio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre com seu e-mail e senha para continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <fieldset disabled={enviando} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erro}
              </p>
            )}

            <Button type="submit" className="mt-1 w-full" disabled={enviando}>
              {enviando && <Loader2 className="size-4 animate-spin" />}
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </fieldset>
        </form>
      </div>
    </div>
  )
}
