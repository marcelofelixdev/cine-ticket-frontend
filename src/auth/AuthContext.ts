import { createContext, useContext } from 'react'
import type { Usuario } from './types'

export type EstadoDaSessao =
  | { status: 'carregando' }
  | { status: 'anonimo' }
  | { status: 'logado'; usuario: Usuario }

export interface Auth {
  sessao: EstadoDaSessao
  entrar: (email: string, senha: string) => Promise<Usuario>
  sair: () => Promise<void>
}

export const AuthContext = createContext<Auth | null>(null)

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }
  return auth
}
