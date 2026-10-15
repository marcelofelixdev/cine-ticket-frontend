import type { Audio, FormaPagamento, Formato, TipoIngresso } from './tipos'

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function moeda(valor: number): string {
  return MOEDA.format(valor)
}

/** "2026-10-15T21:40:00" (LocalDateTime da API, horário de Brasília) → "21:40". */
export function hora(dataHora: string): string {
  return dataHora.slice(11, 16)
}

/** "2026-10-15T21:40:00" ou "2026-10-15" → "15/10". */
export function diaMes(dataHora: string): string {
  return `${dataHora.slice(8, 10)}/${dataHora.slice(5, 7)}`
}

/** Data de hoje no fuso do navegador, no formato da API (AAAA-MM-DD). */
export function hoje(): string {
  return new Date().toLocaleDateString('sv-SE')
}

/** Soma dias a uma data AAAA-MM-DD. */
export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00`)
  d.setDate(d.getDate() + dias)
  return d.toLocaleDateString('sv-SE')
}

export const NOME_DO_TIPO: Record<TipoIngresso, string> = {
  INTEIRA: 'Inteira',
  MEIA_ESTUDANTE: 'Meia estudante',
  MEIA_IDOSO: 'Meia 60+',
}

export const NOME_DA_FORMA: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CREDITO: 'Crédito',
  DEBITO: 'Débito',
}

const SIGLA_DO_AUDIO: Record<Audio, string> = {
  DUBLADO: 'DUB',
  LEGENDADO: 'LEG',
  NACIONAL: 'NAC',
}

/** "3D LEG", "2D DUB". */
export function versao(formato: Formato, audio: Audio): string {
  return `${formato} ${SIGLA_DO_AUDIO[audio]}`
}

export function ehMeia(tipo: TipoIngresso): boolean {
  return tipo !== 'INTEIRA'
}

/** Preço de um tipo de ingresso com os valores que a API manda na sessão (valorBase e valorMeia). */
export function precoDoTipo(sessao: { valorBase: number; valorMeia: number }, tipo: TipoIngresso): number {
  return ehMeia(tipo) ? sessao.valorMeia : sessao.valorBase
}
