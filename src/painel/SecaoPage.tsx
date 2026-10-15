import type { ComponentType } from 'react'
import { Navigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { menuDoPainel, papelDoPainel, type PapelPainel } from '../auth/papeis'
import { CinemasPage } from './admin/CinemasPage'
import { EquipePage as EquipeDaRedePage } from './admin/EquipePage'
import { FilmesPage } from './admin/FilmesPage'
import { IngressosPage as IngressosDaRedePage } from './admin/IngressosPage'
import { PedidosPage as PedidosDaRedePage } from './admin/PedidosPage'
import { CaixaPage } from './caixa/CaixaPage'
import { DevolucoesPage } from './caixa/DevolucoesPage'
import { EntradaPage } from './entrada/EntradaPage'
import { EquipePage } from './gerente/EquipePage'
import { IngressosPage } from './gerente/IngressosPage'
import { PedidosPage } from './gerente/PedidosPage'
import { ProgramacaoPage } from './gerente/ProgramacaoPage'
import { SessoesPage } from './gerente/SessoesPage'
import styles from './Painel.module.css'

/**
 * Página de cada seção, por papel: a mesma seção (ex.: "pedidos") é uma tela para o
 * gerente e outra para o admin. Seções sem página mostram "Em construção".
 */
const PAGINAS: Record<PapelPainel, Partial<Record<string, ComponentType>>> = {
  STAFF: { caixa: CaixaPage, devolucoes: DevolucoesPage, entrada: EntradaPage },
  MANAGER: {
    caixa: CaixaPage,
    devolucoes: DevolucoesPage,
    sessoes: SessoesPage,
    programacao: ProgramacaoPage,
    pedidos: PedidosPage,
    ingressos: IngressosPage,
    equipe: EquipePage,
  },
  ADMIN: {
    pedidos: PedidosDaRedePage,
    filmes: FilmesPage,
    cinemas: CinemasPage,
    equipe: EquipeDaRedePage,
    ingressos: IngressosDaRedePage,
  },
}

/** Seção do painel, só se ela estiver no menu do papel do usuário. */
export function SecaoPage() {
  const { secao } = useParams()
  const papel = usePapel()
  const item = papel ? menuDoPainel(papel).find((i) => i.secao === secao) : undefined

  if (!papel || !item) {
    return <Navigate to="/painel" replace />
  }
  const Pagina = PAGINAS[papel][item.secao]
  if (Pagina) {
    return <Pagina />
  }
  return (
    <section className={styles.janela} aria-labelledby="secao">
      <h1 id="secao" className={styles.janelaTitulo}>
        {item.rotulo}
      </h1>
      <div className={styles.janelaCorpo}>
        <p>Em construção.</p>
      </div>
    </section>
  )
}

/** Abre a primeira seção do menu do usuário. */
export function PainelInicio() {
  const papel = usePapel()
  const primeira = papel ? menuDoPainel(papel)[0] : undefined
  return primeira ? <Navigate to={`/painel/${primeira.secao}`} replace /> : null
}

function usePapel(): PapelPainel | null {
  const { sessao } = useAuth()
  return sessao.status === 'logado' ? papelDoPainel(sessao.usuario.roles) : null
}
