import { apiFetch } from '../api/client'
import type { Pagina } from '../api/pagina'
import type { Audio, Formato } from '../lib/tipos'

/** Chamadas públicas do site (sem login). */

export interface Cidade {
  cidade: string
  uf: string
}

export interface CinemaPublico {
  id: number
  nome: string
  endereco: string
  cidade: string
  uf: string
}

export interface Filme {
  id: number
  titulo: string
  tituloOriginal: string | null
  sinopse: string | null
  posterUrl: string | null
  backdropUrl: string | null
  duracaoEmMinutos: number | null
  classificacao: string | null
  generos: string[] | null
  diretor: string | null
  elenco: Array<{ nome: string; personagem: string | null }> | null
  produtora: string | null
  trailerUrl: string | null
  dataEstreia: string | null
}

export interface SessaoPublica {
  id: number
  horarioInicio: string
  valorBase: number
  valorMeia: number
  movieId: number
  movieTitulo: string
  roomNome: string
  cinemaId: number
  cinemaNome: string
  formato: Formato
  audio: Audio
  lugaresLivres: number | null
  /** Meias que a API ainda aceita nesta sessão (cota). */
  meiasRestantes: number | null
}

/** Filtros da vitrine: a API aplica em filmes e em sessões. */
export interface FiltroDaVitrine {
  formato?: Formato
  audio?: Audio
  classificacao?: string
}

function query(params: Record<string, string | number | undefined>): string {
  const busca = new URLSearchParams()
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== '') {
      busca.set(chave, String(valor))
    }
  }
  return busca.toString()
}

export function cidades(signal?: AbortSignal): Promise<Cidade[]> {
  return apiFetch('/cinemas/cidades', { signal })
}

export function cinemasDaCidade(cidade: string, signal?: AbortSignal): Promise<Pagina<CinemaPublico>> {
  return apiFetch(`/cinemas?${query({ cidade, size: 50 })}`, { signal })
}

export function filmesEmCartaz(cinemaId: number, filtro: FiltroDaVitrine, signal?: AbortSignal): Promise<Pagina<Filme>> {
  return apiFetch(`/movies?${query({ cinemaId, ...filtro, size: 50 })}`, { signal })
}

export function filme(id: number, signal?: AbortSignal): Promise<Filme> {
  return apiFetch(`/movies/${id}`, { signal })
}

/** Sessões de um filme num dia, em cada cinema informado (a API filtra por cinema). */
export async function sessoesDoFilmeNosCinemas(
  movieId: number,
  cinemaIds: number[],
  data: string,
  signal?: AbortSignal,
): Promise<Map<number, SessaoPublica[]>> {
  const listas = await Promise.all(
    cinemaIds.map((cinemaId) =>
      apiFetch<Pagina<SessaoPublica>>(`/sessions?${query({ movieId, cinemaId, date: data, size: 100 })}`, { signal }),
    ),
  )
  return new Map(cinemaIds.map((cinemaId, i) => [cinemaId, listas[i].content]))
}

export function emBreve(cidade: string, signal?: AbortSignal): Promise<Pagina<Filme>> {
  return apiFetch(`/movies/em-breve?${query({ cidade, size: 8 })}`, { signal })
}

/** Sessões do dia num cinema (as que ainda não começaram), em ordem de horário. */
export function sessoesDoDia(
  cinemaId: number,
  data: string,
  filtro: FiltroDaVitrine,
  signal?: AbortSignal,
): Promise<Pagina<SessaoPublica>> {
  const { formato, audio } = filtro
  return apiFetch(`/sessions?${query({ cinemaId, date: data, formato, audio, size: 200 })}`, { signal })
}
