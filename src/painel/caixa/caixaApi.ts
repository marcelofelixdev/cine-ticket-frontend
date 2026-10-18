import { apiBlob, apiFetch } from '../../api/client'
import type { FormaPagamento, TipoIngresso } from '../../lib/tipos'
import type { SessaoDoDia } from '../comum/sessaoDoDia'

export interface ItemDaVenda {
  seatId: number
  ticketType: TipoIngresso
  documentoMeia?: string
}

export interface PedidoDeVenda {
  sessionId: number
  itens: ItemDaVenda[]
  formaPagamento: FormaPagamento
  clienteEmail?: string
}

export interface Venda {
  sessionId: number
  filmeTitulo: string
  salaNome: string
  horarioSessao: string
  formaPagamento: FormaPagamento
  total: number
  ingressos: Array<{ ticketId: number; assento: string; tipo: TipoIngresso; valor: number; qr: string }>
}

export interface Devolucao {
  ticketId: number
  filmeTitulo: string
  salaNome: string
  horarioSessao: string
  assento: string
  formaPagamento: FormaPagamento
  valor: number
  clienteEmail: string | null
  status: string
  devolvidoEm: string | null
}

export function sessoesDoDia(data: string, signal?: AbortSignal): Promise<SessaoDoDia[]> {
  return apiFetch(`/box-office/sessions?date=${data}`, { signal })
}


export function vender(pedido: PedidoDeVenda): Promise<Venda> {
  return apiFetch('/box-office/sales', { method: 'POST', json: pedido })
}

export function pdfDoIngresso(ticketId: number): Promise<Blob> {
  return apiBlob(`/box-office/tickets/${ticketId}/pdf`, { accept: 'application/pdf' })
}

export function devolucoesPendentes(signal?: AbortSignal): Promise<Devolucao[]> {
  return apiFetch('/box-office/refunds/pending', { signal })
}

export function confirmarDevolucao(ticketId: number): Promise<Devolucao> {
  return apiFetch(`/box-office/refunds/${ticketId}/confirm`, { method: 'POST' })
}
