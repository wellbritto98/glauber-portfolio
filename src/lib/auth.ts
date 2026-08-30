import type { Auth, User, UserCredential } from 'firebase/auth'
import { app, useEmulators } from './firebase'

/**
 * O SDK de autenticação NUNCA é importado de forma estática.
 *
 * As definições de rota do TanStack Router (incluindo `beforeLoad`) ficam na
 * parte crítica do route tree, que não sofre code splitting. Um import estático
 * de `firebase/auth` no guard do /admin acabaria dentro do bundle que todo
 * visitante do site público baixa. O import dinâmico abaixo mantém o SDK de
 * auth confinado ao chunk carregado sob demanda.
 */

interface AuthBundle {
  auth: Auth
  signIn: (email: string, senha: string) => Promise<UserCredential>
  signOut: () => Promise<void>
  onChange: (cb: (user: User | null) => void) => () => void
}

let bundlePromise: Promise<AuthBundle> | null = null

async function carregar(): Promise<AuthBundle> {
  const mod = await import('firebase/auth')
  const auth = mod.getAuth(app)

  if (useEmulators) {
    mod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  }

  // Espera a restauração da sessão persistida antes de qualquer decisão de
  // rota. Sem isso, um F5 no /admin redirigiria para o login por um instante.
  await auth.authStateReady()

  return {
    auth,
    signIn: (email, senha) => mod.signInWithEmailAndPassword(auth, email, senha),
    signOut: () => mod.signOut(auth),
    onChange: (cb) => mod.onAuthStateChanged(auth, cb),
  }
}

export function ensureAuth(): Promise<AuthBundle> {
  bundlePromise ??= carregar()
  return bundlePromise
}

/** Usuário atual, já com a sessão restaurada. `null` se não houver sessão. */
export async function getCurrentUser(): Promise<User | null> {
  const { auth } = await ensureAuth()
  return auth.currentUser
}

/** Mensagens de erro do Firebase Auth traduzidas para o designer. */
export function mensagemDeErroDeLogin(codigo: string): string {
  switch (codigo) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
    case 'auth/user-disabled':
      return 'Esta conta foi desativada.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet. Verifique sua rede e tente de novo.'
    default:
      return 'Não foi possível entrar. Tente de novo em instantes.'
  }
}
