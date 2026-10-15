import { apiFetch } from '../../api/client'
import type { Pagina } from '../../api/pagina'
import type { CanalVenda, FormaPagamento, StatusIngresso, TipoIngresso } from '../../lib/tipos'

/** Tipos e chamadas que o gerente e o admin usam com caminhos diferentes da API. */

// ---------- Resumo da sessão ----------

/** GET /manager/sessions/{id}/summary e GET /admin/sessions/{id}/summary. */
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

// ---------- TMDB e pedidos de filme ----------

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

export function buscarNoTmdb(termo: string, signal?: AbortSignal): Promise<FilmeDoTmdb[]> {
  return apiFetch(`/tmdb/search?q=${encodeURIComponent(termo)}`, { signal })
}

export type SituacaoDoPedido = 'AGUARDANDO_ADMIN' | 'APROVADO' | 'RECUSADO'

export const NOME_DA_SITUACAO_DO_PEDIDO: Record<SituacaoDoPedido, string> = {
  AGUARDANDO_ADMIN: 'Aguardando o admin',
  APROVADO: 'Aprovado',
  RECUSADO: 'Recusado',
}

export interface PedidoDeFilme {
  id: number
  tmdbId: number
  titulo: string
  ano: number | null
  posterUrl: string | null
  cinemaId: number
  cinemaNome: string
  solicitadoPor: string | null
  status: SituacaoDoPedido
  motivoRecusa: string | null
  criadoEm: string
  decididoEm: string | null
}

// ---------- Programação ----------

export type SituacaoNaProgramacao = 'AGUARDANDO_GERENTE' | 'ATIVO'

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
  /** Só no admin; o gerente vê sempre o próprio cinema. */
  cinemaId?: string
  date?: string
  status?: StatusIngresso
  canal?: CanalVenda
  email?: string
}

/** GET /manager/tickets ou /admin/tickets com os filtros preenchidos. */
export function listarIngressos(
  caminho: '/manager/tickets' | '/admin/tickets',
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
  return apiFetch(`${caminho}?${params}`, { signal })
}

// ---------- Equipe ----------

export type PapelDaEquipe = 'MANAGER' | 'STAFF'

export const NOME_DO_PAPEL_DA_EQUIPE: Record<PapelDaEquipe, string> = { MANAGER: 'Gerente', STAFF: 'Funcionário' }

export interface MembroDaEquipe {
  id: number
  nome: string
  email: string
  papel: PapelDaEquipe
  cinemaId: number
  cinemaNome: string
}

/** Nome, e-mail e senha inicial de quem vai entrar no painel. */
export interface DadosDeAcesso {
  nome: string
  email: string
  senha: string
}

export const ACESSO_VAZIO: DadosDeAcesso = { nome: '', email: '', senha: '' }
