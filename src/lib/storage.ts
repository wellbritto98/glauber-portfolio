import type { FirebaseStorage } from 'firebase/storage'
import { app, useEmulators } from './firebase'

/**
 * O SDK de Storage só é usado para enviar e apagar arquivos — operações
 * exclusivas do painel admin. O site público consome as imagens por URL HTTPS
 * comum, sem SDK nenhum. Por isso o import é dinâmico: mantém o Storage fora
 * do bundle do visitante.
 */

type StorageModule = typeof import('firebase/storage')

let promessa: Promise<{ storage: FirebaseStorage; mod: StorageModule }> | null = null

async function carregar() {
  const mod = await import('firebase/storage')
  const storage = mod.getStorage(app)
  if (useEmulators) {
    mod.connectStorageEmulator(storage, '127.0.0.1', 9199)
  }
  return { storage, mod }
}

export function ensureStorage() {
  promessa ??= carregar()
  return promessa
}
