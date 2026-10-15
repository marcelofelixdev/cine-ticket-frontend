import { Link } from 'react-router'
import { Logo } from '../components/Logo'
import styles from './SiteProvisorio.module.css'

/** Página inicial provisória: o site público (vitrine, filme, assentos) vem no item 8.5. */
export function SiteProvisorio() {
  return (
    <main className={styles.pagina}>
      <Logo className={styles.logo} />
      <p>O site está sendo montado. A equipe dos cinemas já pode usar o painel.</p>
      <Link to="/painel" className={styles.botao}>
        Painel da equipe
      </Link>
    </main>
  )
}
