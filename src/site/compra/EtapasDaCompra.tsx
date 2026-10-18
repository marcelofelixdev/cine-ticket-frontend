import styles from './Compra.module.css'

const ETAPAS = ['Lugares', 'Pagamento', 'Ingresso']

/** 1 Lugares · 2 Pagamento · 3 Ingresso, com a etapa atual marcada. */
export function EtapasDaCompra({ atual }: { atual: number }) {
  return (
    <ol className={styles.etapas} aria-label="Etapas da compra">
      {ETAPAS.map((etapa, i) => (
        <li key={etapa} className={i === atual ? styles.etapaAtual : undefined} aria-current={i === atual ? 'step' : undefined}>
          {i + 1} {etapa}
        </li>
      ))}
    </ol>
  )
}
