import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

export interface Carregamento<T> {
  dados: T | null
  erro: string | null
  carregando: boolean
  recarregar: () => void
}

/**
 * Busca dados ao montar e sempre que `chave` mudar, cancelando a busca anterior.
 * `buscar` recebe o AbortSignal da busca.
 */
export function useCarregar<T>(buscar: ((signal: AbortSignal) => Promise<T>) | null, chave: string): Carregamento<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    if (!buscar) {
      setDados(null)
      return
    }
    const controller = new AbortController()
    setCarregando(true)
    setErro(null)
    buscar(controller.signal)
      .then((resultado) => setDados(resultado))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setErro(mensagemDeErro(e))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCarregando(false)
        }
      })
    return () => controller.abort()
    // buscar muda a cada render; a chave diz quando buscar de novo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  return { dados, erro, carregando, recarregar }
}

export function mensagemDeErro(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Não foi possível falar com o servidor. Tente de novo.'
}
