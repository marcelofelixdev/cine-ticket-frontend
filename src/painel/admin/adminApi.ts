import { apiFetch } from '../../api/client'
import type { Pagina } from '../../api/pagina'
import type {
  DadosDeAcesso,
  MembroDaEquipe,
  PapelDaEquipe,
  PedidoDeFilme,
  ResumoDaSessao,
  SituacaoDoPedido,
  SituacaoNaProgramacao,
} from '../comum/painelApi'

// ---------- Pedidos de filme ----------

export function pedidosDaRede(situacao: SituacaoDoPedido | '', signal?: AbortSignal): Promise<PedidoDeFilme[]> {
  return apiFetch(`/admin/movie-requests${situacao ? `?status=${situacao}` : ''}`, { signal })
}

export function aprovarPedido(id: number): Promise<PedidoDeFilme> {
  return apiFetch(`/admin/movie-requests/${id}/approve`, { method: 'POST' })
}

export function recusarPedido(id: number, motivo: string): Promise<PedidoDeFilme> {
  return apiFetch(`/admin/movie-requests/${id}/reject`, { method: 'POST', json: { motivo } })
}

// ---------- Filmes ----------

export interface SituacaoNoCinema {
  cinemaId: number
  cinemaNome: string
  status: SituacaoNaProgramacao
}

/** GET /admin/movies: catálogo inteiro, inclusive fora de cartaz. */
export interface FilmeDoCatalogo {
  id: number
  titulo: string
  tmdbId: string | null
  posterUrl: string | null
  duracaoEmMinutos: number | null
  classificacao: string | null
  cinemas: SituacaoNoCinema[]
}

/** Campos que o admin corrige à mão (MovieUpdateDTO): os nulos ficam como estão. */
export interface CorrecaoDoFilme {
  titulo: string | null
  duracaoEmMinutos: number | null
  sinopse: string | null
  classificacao: string | null
  dataEstreia: string | null
}

export interface FichaDoFilme extends CorrecaoDoFilme {
  id: number
}

export function catalogo(pagina: number, signal?: AbortSignal): Promise<Pagina<FilmeDoCatalogo>> {
  return apiFetch(`/admin/movies?page=${pagina}&size=20`, { signal })
}

export function fichaDoFilme(id: number, signal?: AbortSignal): Promise<FichaDoFilme> {
  return apiFetch(`/movies/${id}`, { signal })
}

export function cadastrarDoTmdb(tmdbId: number): Promise<{ id: number; titulo: string }> {
  return apiFetch('/movies', { method: 'POST', json: { tmdbId } })
}

export function corrigirFilme(id: number, correcao: CorrecaoDoFilme): Promise<unknown> {
  return apiFetch(`/movies/${id}`, { method: 'PUT', json: correcao })
}

export function sincronizarComTmdb(id: number): Promise<unknown> {
  return apiFetch(`/movies/${id}/tmdb-sync`, { method: 'POST' })
}

export function excluirFilme(id: number): Promise<void> {
  return apiFetch(`/movies/${id}`, { method: 'DELETE' })
}

export function enviarAosCinemas(id: number, cinemaIds: number[]): Promise<SituacaoNoCinema[]> {
  return apiFetch(`/admin/movies/${id}/offer`, { method: 'POST', json: { cinemaIds } })
}

// ---------- Cinemas e salas ----------

export interface DadosDoCinema {
  nome: string
  cnpj: string
  endereco: string
  cidade: string
  uf: string
}

export interface Cinema extends DadosDoCinema {
  id: number
}

export interface SalaDaRede {
  id: number
  nome: string
  capacidade: number
  cinemaId: number
  cinemaNome: string
  cadeirasPorFila: number
  corredores: number[]
}

/** RoomRequestDTO: capacidade e cadeiras por fila não mudam depois de criar; corredores nulos ficam como estão. */
export interface DadosDaSala {
  nome: string
  capacidade: number
  cinemaId: number
  cadeirasPorFila: number
  corredores: number[]
}

export function cinemas(pagina: number, signal?: AbortSignal): Promise<Pagina<Cinema>> {
  return apiFetch(`/cinemas?page=${pagina}&size=20`, { signal })
}

/** Para os seletores de cinema: a rede tem poucos, uma página basta. */
export function todosOsCinemas(signal?: AbortSignal): Promise<Pagina<Cinema>> {
  return apiFetch('/cinemas?size=100', { signal })
}

export function criarCinema(dados: DadosDoCinema): Promise<Cinema> {
  return apiFetch('/cinemas', { method: 'POST', json: dados })
}

export function editarCinema(id: number, dados: DadosDoCinema): Promise<Cinema> {
  return apiFetch(`/cinemas/${id}`, { method: 'PUT', json: dados })
}

export function excluirCinema(id: number): Promise<void> {
  return apiFetch(`/cinemas/${id}`, { method: 'DELETE' })
}

export function salas(pagina: number, signal?: AbortSignal): Promise<Pagina<SalaDaRede>> {
  return apiFetch(`/rooms?page=${pagina}&size=20&sort=cinema.nome,asc&sort=nome,asc`, { signal })
}

export function criarSala(dados: DadosDaSala): Promise<SalaDaRede> {
  return apiFetch('/rooms', { method: 'POST', json: dados })
}

export function editarSala(id: number, dados: DadosDaSala): Promise<SalaDaRede> {
  return apiFetch(`/rooms/${id}`, { method: 'PUT', json: dados })
}

export function excluirSala(id: number): Promise<void> {
  return apiFetch(`/rooms/${id}`, { method: 'DELETE' })
}

// ---------- Equipe ----------

export function equipeDaRede(cinemaId: string, signal?: AbortSignal): Promise<MembroDaEquipe[]> {
  return apiFetch(`/admin/team${cinemaId ? `?cinemaId=${cinemaId}` : ''}`, { signal })
}

export function cadastrarNaEquipe(
  dados: DadosDeAcesso & { papel: PapelDaEquipe; cinemaId: number | null },
): Promise<MembroDaEquipe> {
  return apiFetch('/admin/team', { method: 'POST', json: dados })
}

// ---------- Ingressos ----------

export function resumoDaSessaoNaRede(id: number, signal?: AbortSignal): Promise<ResumoDaSessao> {
  return apiFetch(`/admin/sessions/${id}/summary`, { signal })
}
