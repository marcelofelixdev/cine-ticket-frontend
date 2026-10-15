import type { Pagina } from '../../api/pagina'
import styles from '../Painel.module.css'

interface Props {
  info: Pagina<unknown>['page'] | undefined
  /** "ingressos", "filmes"… */
  itens: string
  onMudar: (pagina: number) => void
}

/** Anterior / próxima de uma lista paginada pela API; some quando há uma página só. */
export function Paginacao({ info, itens, onMudar }: Props) {
  if (!info || info.totalPages <= 1) {
    return null
  }
  return (
    <div className={styles.paginacao}>
      <button type="button" className={styles.botao} disabled={info.number === 0} onClick={() => onMudar(info.number - 1)}>
        ◄ Anterior
      </button>
      <span>
        Página {info.number + 1} de {info.totalPages} ({info.totalElements} {itens})
      </span>
      <button
        type="button"
        className={styles.botao}
        disabled={info.number + 1 >= info.totalPages}
        onClick={() => onMudar(info.number + 1)}
      >
        Próxima ►
      </button>
    </div>
  )
}
