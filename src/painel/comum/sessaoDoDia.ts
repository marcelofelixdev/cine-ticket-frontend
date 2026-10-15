import type { Audio, Formato } from '../../lib/tipos'

/** Sessão do dia no cinema do usuário (GET /box-office/sessions e GET /manager/sessions). */
export interface SessaoDoDia {
  id: number
  horarioInicio: string
  horarioFim: string
  movieTitulo: string
  classificacao: string | null
  roomNome: string
  formato: Formato
  audio: Audio
  valorBase: number
  valorMeia: number
  lugares: number
  ocupados: number
  meias: number
  /** Só na lista do gerente; no caixa vem nula. */
  receita: number | null
  /** O caixa ainda vende (a API decide: até 30 min depois do início). */
  vendasAbertas: boolean
}
