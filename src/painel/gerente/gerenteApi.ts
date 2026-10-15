import { apiFetch } from '../../api/client'
import type { Pagina } from '../../api/pagina'
import type { Audio, CanalVenda, FormaPagamento, Formato, StatusIngresso, TipoIngresso } from '../../lib/tipos'
import type { SessaoDoDia } from '../comum/sessaoDoDia'

// ---------- Sessões ----------

export interface ResumoDaSessao {
  sessionId: number
  filmeTitulo: string
  salaNome: string
  horarioSessao: string
  ativa: boolean
  lugares: number
  vendidos: number
  reservados: number
  livres: number
  meias: number
  entradas: number
  receitaTotal: number
  receitaOnline: number
  receitaBalcao: number
  receitaBalcaoPorForma: Partial<Record<FormaPagamento, number>>
}

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
  status: 'AGUARDANDO_GERENTE' | 'ATIVO'
  confirmadoEm: string | null
}

export interface FilmeDoTmdb {
  tmdbId: number
  titulo: string
  tituloOriginal: string | null
  ano: number | null
  posterUrl: string | null
  sinopse: string | null
  /** Já está no catálogo da rede. */
  filmeId: number | null
}

export interface PedidoDeFilme {
  id: number
  tmdbId: number
  titulo: string
  ano: number | null
  posterUrl: string | null
  cinemaNome: string
  solicitadoPor: string | null
  status: 'AGUARDANDO_ADMIN' | 'APROVADO' | 'RECUSADO'
  motivoRecusa: string | null
  criadoEm: string
  decididoEm: string | null
}

export function programacao(signal?: AbortSignal): Promise<ItemDaProgramacao[]> {
  return apiFetch('/manager/programacao', { signal })
}

export function confirmarFilme(movieId: number): Promise<ItemDaProgramacao> {
  return apiFetch(`/manager/programacao/${movieId}/confirm`, { method: 'POST' })
}

export function buscarNoTmdb(termo: string, signal?: AbortSignal): Promise<FilmeDoTmdb[]> {
  return apiFetch(`/tmdb/search?q=${encodeURIComponent(termo)}`, { signal })
}

export function pedidosDoCinema(signal?: AbortSignal): Promise<PedidoDeFilme[]> {
  return apiFetch('/manager/movie-requests', { signal })
}

export function pedirFilme(tmdbId: number): Promise<PedidoDeFilme> {
  return apiFetch('/manager/movie-requests', { method: 'POST', json: { tmdbId } })
}

// ---------- Ingressos ----------

export interface IngressoDoPainel {
  id: number
  status: StatusIngresso
  canal: CanalVenda
  formaPagamento: FormaPagamento | null
  sessionId: number
  filmeTitulo: string
  salaNome: string
  horarioSessao: string
  assento: string
  tipo: TipoIngresso
  valorPago: number
  clienteEmail: string | null
  vendidoPor: string | null
  reembolso: string | null
  utilizadoEm: string | null
  criadoEm: string
}

export interface FiltroDeIngressos {
  date?: string
  status?: StatusIngresso
  canal?: CanalVenda
  email?: string
}

export function ingressosDoCinema(
  filtro: FiltroDeIngressos,
  pagina: number,
  signal?: AbortSignal,
): Promise<Pagina<IngressoDoPainel>> {
  const params = new URLSearchParams({ page: String(pagina), size: '20' })
  for (const [chave, valor] of Object.entries(filtro)) {
    if (valor) {
      params.set(chave, valor)
    }
  }
  return apiFetch(`/manager/tickets?${params}`, { signal })
}

export function cancelarVenda(id: number): Promise<unknown> {
  return apiFetch(`/manager/tickets/${id}/cancel`, { method: 'POST' })
}

// ---------- Equipe ----------

export interface MembroDaEquipe {
  id: number
  nome: string
  email: string
  papel: 'MANAGER' | 'STAFF'
}

export function equipe(signal?: AbortSignal): Promise<MembroDaEquipe[]> {
  return apiFetch('/manager/staff', { signal })
}

export function cadastrarFuncionario(dados: { nome: string; email: string; senha: string }): Promise<MembroDaEquipe> {
  return apiFetch('/manager/staff', { method: 'POST', json: dados })
}
