import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const faltando = Object.entries(config)
  .filter(([, v]) => !v)
  .map(([k]) => k)

if (faltando.length > 0) {
  throw new Error(
    `Configuração do Firebase incompleta. Faltando: ${faltando.join(', ')}. ` +
      'Confira o arquivo .env.local (use .env.example como modelo).',
  )
}

export const useEmulators = import.meta.env.VITE_USE_EMULATORS === '1'

export const app = initializeApp(config)

/**
 * Só o Firestore é carregado de forma estática: é a única parte do SDK de que
 * o site público precisa. Auth (lib/auth.ts) e Storage (lib/storage.ts) entram
 * por import dinâmico, para não pesarem no bundle do visitante.
 */
export const db = getFirestore(app)

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
