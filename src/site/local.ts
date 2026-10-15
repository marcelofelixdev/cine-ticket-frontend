import { createContext, useContext } from 'react'
import type { CinemaPublico, Cidade } from './siteApi'

/** Cidade e cinema escolhidos no cabeçalho do site; valem para todas as páginas. */
export interface Local {
  cidade: Cidade | null
  cinema: CinemaPublico | null
  cinemasDaCidade: CinemaPublico[]
  escolherCinema: (cinemaId: number) => void
}

export const LocalContext = createContext<Local>({
  cidade: null,
  cinema: null,
  cinemasDaCidade: [],
  escolherCinema: () => {},
})

export function useLocal(): Local {
  return useContext(LocalContext)
}

export interface EscolhaGuardada {
  cidade?: string
  uf?: string
  cinemaId?: number
}

const CHAVE = 'cineticket.local'

/** Lembra a cidade e o cinema neste navegador (conveniência; sem storage, usa o primeiro). */
export function lerEscolha(): EscolhaGuardada {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as EscolhaGuardada
  } catch {
    return {}
  }
}

export function guardarEscolha(escolha: EscolhaGuardada) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(escolha))
  } catch {
    // Sem storage: só não lembra.
  }
}
