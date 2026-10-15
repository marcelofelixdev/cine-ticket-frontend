import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '../api/client'
import * as authApi from './authApi'
import { AuthContext, type Auth, type EstadoDaSessao } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<EstadoDaSessao>({ status: 'carregando' })

  useEffect(() => {
    let ativo = true
    setUnauthorizedHandler(() => setSessao({ status: 'anonimo' }))
    authApi
      .restore()
      .then((usuario) => {
        if (ativo) {
          setSessao(usuario ? { status: 'logado', usuario } : { status: 'anonimo' })
        }
      })
      .catch(() => {
        if (ativo) {
          setSessao({ status: 'anonimo' })
        }
      })
    return () => {
      ativo = false
      setUnauthorizedHandler(null)
    }
  }, [])

  const entrar = useCallback(async (email: string, senha: string) => {
    const usuario = await authApi.login(email, senha)
    setSessao({ status: 'logado', usuario })
    return usuario
  }, [])

  const sair = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setSessao({ status: 'anonimo' })
    }
  }, [])

  const auth = useMemo<Auth>(() => ({ sessao, entrar, sair }), [sessao, entrar, sair])
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
