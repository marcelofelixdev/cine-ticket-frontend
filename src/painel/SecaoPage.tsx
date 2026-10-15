import { Navigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { menuDoPainel, papelDoPainel } from '../auth/papeis'
import styles from './Painel.module.css'

/** Seção do painel. Por enquanto só a moldura: o conteúdo de cada uma vem nos itens 8.2 a 8.4. */
export function SecaoPage() {
  const { secao } = useParams()
  const item = useItensDoMenu().find((i) => i.secao === secao)

  if (!item) {
    return <Navigate to="/painel" replace />
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
