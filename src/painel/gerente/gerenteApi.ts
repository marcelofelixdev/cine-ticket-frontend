import { apiFetch } from '../../api/client'
import type { Audio, Formato } from '../../lib/tipos'
import type {
  DadosDeAcesso,
  MembroDaEquipe,
  PedidoDeFilme,
  ResumoDaSessao,
  SituacaoNaProgramacao,
} from '../comum/painelApi'
import { noCinema } from '../comum/painelApi'
import type { SessaoDoDia } from '../comum/sessaoDoDia'

// As rotas de operação do cinema recebem `cinemaId` (null para o gerente: a API usa o dele;
// o admin manda o cinema escolhido no cabeçalho).

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

export function sessoesDoGerente(data: string, cinemaId: number | null, signal?: AbortSignal): Promise<SessaoDoDia[]> {
  return apiFetch(noCinema(`/manager/sessions?date=${data}`, cinemaId), { signal })
}

export function resumoDaSessao(id: number, cinemaId: number | null, signal?: AbortSignal): Promise<ResumoDaSessao> {
  return apiFetch(noCinema(`/manager/sessions/${id}/summary`, cinemaId), { signal })
}

export function cancelarSessao(id: number, cinemaId: number | null): Promise<void> {
  return apiFetch(noCinema(`/manager/sessions/${id}`, cinemaId), { method: 'DELETE' })
}

export function salasDoCinema(cinemaId: number | null, signal?: AbortSignal): Promise<Sala[]> {
  return apiFetch(noCinema('/manager/rooms', cinemaId), { signal })
}

export function criarSessao(sessao: NovaSessao, cinemaId: number | null): Promise<unknown> {
  return apiFetch(noCinema('/manager/sessions', cinemaId), { method: 'POST', json: sessao })
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

export function programacao(cinemaId: number | null, signal?: AbortSignal): Promise<ItemDaProgramacao[]> {
  return apiFetch(noCinema('/manager/programacao', cinemaId), { signal })
}

export function confirmarFilme(movieId: number, cinemaId: number | null): Promise<ItemDaProgramacao> {
  return apiFetch(noCinema(`/manager/programacao/${movieId}/confirm`, cinemaId), { method: 'POST' })
}

export function pedidosDoCinema(signal?: AbortSignal): Promise<PedidoDeFilme[]> {
  return apiFetch('/manager/movie-requests', { signal })
}

export function pedirFilme(tmdbId: number): Promise<PedidoDeFilme> {
  return apiFetch('/manager/movie-requests', { method: 'POST', json: { tmdbId } })
}

// ---------- Ingressos ----------

export function cancelarVenda(id: number, cinemaId: number | null): Promise<unknown> {
  return apiFetch(noCinema(`/manager/tickets/${id}/cancel`, cinemaId), { method: 'POST' })
}

// ---------- Equipe ----------

export function equipe(signal?: AbortSignal): Promise<MembroDaEquipe[]> {
  return apiFetch('/manager/staff', { signal })
}

export function cadastrarFuncionario(dados: DadosDeAcesso): Promise<MembroDaEquipe> {
  return apiFetch('/manager/staff', { method: 'POST', json: dados })
}
