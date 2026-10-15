import type { SessaoDoDia } from './caixaApi'

/** Vendas do balcão fecham 30 minutos depois do início (mesma regra do BoxOfficeService). */
const VENDAS_FECHAM_APOS_MS = 30 * 60 * 1000

export function vendasEncerradas(sessao: Pick<SessaoDoDia, 'horarioInicio'>, agora = Date.now()): boolean {
  return agora > new Date(sessao.horarioInicio).getTime() + VENDAS_FECHAM_APOS_MS
}
