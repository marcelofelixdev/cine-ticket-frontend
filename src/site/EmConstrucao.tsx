import { Link } from 'react-router'
import styles from './Site.module.css'

/** Páginas do site que ainda serão feitas nas próximas etapas do 8.5. */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <main className={styles.pagina}>
      <h1 className={styles.titulo}>{titulo}</h1>
      <p>Esta parte do site está sendo montada.</p>
      <Link to="/">Voltar para a programação</Link>
    </main>
  )
}
