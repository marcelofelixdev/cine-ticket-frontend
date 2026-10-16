import styles from '../Painel.module.css'

interface Props {
  sucesso?: string | null
  erro?: string | null
}

/** Mensagem de sucesso (status) e de erro (alert) de uma ação do painel. */
export function Avisos({ sucesso, erro }: Props) {
  return (
    <>
      {sucesso && (
        <p className={styles.sucesso} role="status">
          {sucesso}
        </p>
      )}
      {erro && (
        <p className={styles.alerta} role="alert">
          {erro}
        </p>
      )}
    </>
  )
}
