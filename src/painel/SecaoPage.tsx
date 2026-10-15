import type { ComponentType } from 'react'
import { Navigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { menuDoPainel, papelDoPainel } from '../auth/papeis'
import { CaixaPage } from './caixa/CaixaPage'
import { DevolucoesPage } from './caixa/DevolucoesPage'
import { EntradaPage } from './entrada/EntradaPage'
import styles from './Painel.module.css'

/** Seções já prontas; as demais mostram "Em construção" até os itens 8.3 e 8.4. */
const PAGINAS: Partial<Record<string, ComponentType>> = {
  caixa: CaixaPage,
  devolucoes: DevolucoesPage,
  entrada: EntradaPage,
}

/** Seção do painel, só se ela estiver no menu do papel do usuário. */
export function SecaoPage() {
  const { secao } = useParams()
  const item = useItensDoMenu().find((i) => i.secao === secao)

  if (!item) {
    return <Navigate to="/painel" replace />
  }
  const Pagina = PAGINAS[item.secao]
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
  const primeira = useItensDoMenu()[0]
  return primeira ? <Navigate to={`/painel/${primeira.secao}`} replace /> : null
}

function useItensDoMenu() {
  const { sessao } = useAuth()
  const papel = sessao.status === 'logado' ? papelDoPainel(sessao.usuario.roles) : null
  return papel ? menuDoPainel(papel) : []
}
