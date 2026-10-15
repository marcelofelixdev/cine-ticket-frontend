import { apiFetch } from '../../api/client'
import type { Audio, Formato } from '../../lib/tipos'
import type {
  DadosDeAcesso,
  MembroDaEquipe,
  PedidoDeFilme,
  ResumoDaSessao,
  SituacaoNaProgramacao,
} from '../comum/painelApi'
import type { SessaoDoDia } from '../comum/sessaoDoDia'

// ---------- Sessões ----------

export interface Sala {
  id: number
  nome: string
  capacidade: number
}

export interface NovaSessao {
  movieId: number
  roomId: number
  horarioInicio: string
  valorBase: number
  formato: Formato
  audio: Audio
}

export function sessoesDoGerente(data: string, signal?: AbortSignal): Promise<SessaoDoDia[]> {
  return apiFetch(`/manager/sessions?date=${data}`, { signal })
}

export function resumoDaSessao(id: number, signal?: AbortSignal): Promise<ResumoDaSessao> {
  return apiFetch(`/manager/sessions/${id}/summary`, { signal })
}

export function cancelarSessao(id: number): Promise<void> {
  return apiFetch(`/manager/sessions/${id}`, { method: 'DELETE' })
}

export function salasDoCinema(signal?: AbortSignal): Promise<Sala[]> {
  return apiFetch('/manager/rooms', { signal })
}

export function criarSessao(sessao: NovaSessao): Promise<unknown> {
  return apiFetch('/manager/sessions', { method: 'POST', json: sessao })
}

// ---------- Programação e pedidos ----------

export interface ItemDaProgramacao {
  movieId: number
  titulo: string
  posterUrl: string | null
  classificacao: string | null
  duracaoEmMinutos: number | null
  status: SituacaoNaProgramacao
  confirmadoEm: string | null
}

export function programacao(signal?: AbortSignal): Promise<ItemDaProgramacao[]> {
  return apiFetch('/manager/programacao', { signal })
}

export function confirmarFilme(movieId: number): Promise<ItemDaProgramacao> {
  return apiFetch(`/manager/programacao/${movieId}/confirm`, { method: 'POST' })
}

export function pedidosDoCinema(signal?: AbortSignal): Promise<PedidoDeFilme[]> {
  return apiFetch('/manager/movie-requests', { signal })
}

export function pedirFilme(tmdbId: number): Promise<PedidoDeFilme> {
  return apiFetch('/manager/movie-requests', { method: 'POST', json: { tmdbId } })
}

// ---------- Ingressos ----------

export function cancelarVenda(id: number): Promise<unknown> {
  return apiFetch(`/manager/tickets/${id}/cancel`, { method: 'POST' })
}

// ---------- Equipe ----------

export function equipe(signal?: AbortSignal): Promise<MembroDaEquipe[]> {
  return apiFetch('/manager/staff', { signal })
}

export function cadastrarFuncionario(dados: DadosDeAcesso): Promise<MembroDaEquipe> {
  return apiFetch('/manager/staff', { method: 'POST', json: dados })
}
