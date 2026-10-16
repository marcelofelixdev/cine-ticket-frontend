import { createContext, useContext } from 'react'
import type { VisaoDoPainel } from '../auth/papeis'

export interface Escopo {
  visao: VisaoDoPainel | null
  /** Cinema que o admin escolheu no cabeçalho; null para o gerente (a API usa o dele) e na rede toda. */
  cinemaId: number | null
}

export const EscopoContext = createContext<Escopo>({ visao: null, cinemaId: null })

export function useEscopo(): Escopo {
  return useContext(EscopoContext)
}

/** cinemaId para as rotas do gerente: só vai quando o admin escolheu um cinema. */
export function useCinemaEscolhido(): number | null {
  return useEscopo().cinemaId
}

const CHAVE = 'painel.cinema'

/** Lembra o cinema escolhido nesta aba (conveniência; sem storage, volta para a rede). */
export function lerCinemaGuardado(): number | null {
  try {
    const valor = sessionStorage.getItem(CHAVE)
    return valor ? Number(valor) : null
  } catch {
    return null
  }
}

export function guardarCinema(cinemaId: number | null) {
  try {
    if (cinemaId === null) {
      sessionStorage.removeItem(CHAVE)
    } else {
      sessionStorage.setItem(CHAVE, String(cinemaId))
    }
  } catch {
    // Sem storage (aba privada, bloqueio): só não lembra a escolha.
  }
}
