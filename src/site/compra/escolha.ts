import type { TipoIngresso } from '../../lib/tipos'

/** Lugares escolhidos numa sessão, guardados até a reserva (sobrevivem ao login). */
export interface LugarEscolhido {
  seatId: number
  rotulo: string
  tipo: TipoIngresso
  documentoMeia?: string
}

export interface Escolha {
  sessionId: number
  lugares: LugarEscolhido[]
}

const CHAVE = 'cineticket.escolha'

export function lerEscolha(sessionId: number): LugarEscolhido[] {
  try {
    const escolha = JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null') as Escolha | null
    return escolha?.sessionId === sessionId ? escolha.lugares : []
  } catch {
    return []
  }
}

export function guardarEscolha(escolha: Escolha) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(escolha))
  } catch {
    // Sem storage: a escolha vale só enquanto a página estiver aberta.
  }
}
