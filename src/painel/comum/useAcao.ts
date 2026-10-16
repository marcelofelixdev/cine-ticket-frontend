import { useCallback, useState } from 'react'
import { errosPorCampo, mensagemDeErro } from '../../lib/erros'

export interface Acao {
  enviando: boolean
  sucesso: string | null
  erro: string | null
  /** Erros de validação da API por campo (422). */
  erros: Record<string, string>
  /** Roda a chamada; a mensagem devolvida vira o aviso de sucesso. Devolve se deu certo. */
  executar: (chamada: () => Promise<string | void>) => Promise<boolean>
}

/** Estado de uma ação do painel que fala com a API: enviando, sucesso e erros. */
export function useAcao(): Acao {
  const [enviando, setEnviando] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})

  const executar = useCallback(async (chamada: () => Promise<string | void>) => {
    setEnviando(true)
    setSucesso(null)
    setErro(null)
    setErros({})
    try {
      const mensagem = await chamada()
      if (mensagem) {
        setSucesso(mensagem)
      }
      return true
    } catch (e) {
      setErro(mensagemDeErro(e))
      setErros(errosPorCampo(e))
      return false
    } finally {
      setEnviando(false)
    }
  }, [])

  return { enviando, sucesso, erro, erros, executar }
}
