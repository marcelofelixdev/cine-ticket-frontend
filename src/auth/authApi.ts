import { apiFetch, refreshAccessToken, setAccessToken } from '../api/client'
import type { Usuario } from './types'

interface TokenResponse {
  token: string
  expiresIn: number
}

export async function login(email: string, senha: string): Promise<Usuario> {
  const { token } = await apiFetch<TokenResponse>('/auth/login', { method: 'POST', json: { email, senha } })
  setAccessToken(token)
  return me()
}

export function me(): Promise<Usuario> {
  return apiFetch<Usuario>('/users/me')
}

/** Volta a sessão a partir do cookie do refresh token (recarregar a página, abrir outra aba). */
export async function restore(): Promise<Usuario | null> {
  return (await refreshAccessToken()) ? me() : null
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' })
  } finally {
    setAccessToken(null)
  }
}
