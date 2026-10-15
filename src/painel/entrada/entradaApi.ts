import { apiFetch } from '../../api/client'
import type { TipoIngresso } from '../../lib/tipos'

/** Resposta de POST /tickets/validate. */
export interface EntradaLiberada {
  ticketId: number
  filmeTitulo: string
  cinemaNome: string
  salaNome: string
  cadeiraAssento: string
  horarioSessao: string
  ticketType: TipoIngresso
  /** O que conferir pessoalmente (ex.: carteira da meia), ou null. */
  alerta: string | null
  utilizadoEm: string
}

export function validarIngresso(qr: string): Promise<EntradaLiberada> {
  return apiFetch('/tickets/validate', { method: 'POST', json: { qr } })
}
