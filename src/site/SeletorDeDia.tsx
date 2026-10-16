import { diaDaSemana, hoje, somarDias } from '../lib/formato'
import styles from './Site.module.css'

interface Props {
  dia: string
  onEscolher: (dia: string) => void
  /** Quantos dias a partir de hoje. */
  dias?: number
}

/** Hoje e os próximos dias, como pílulas. */
export function SeletorDeDia({ dia, onEscolher, dias = 7 }: Props) {
  const lista = Array.from({ length: dias }, (_, i) => somarDias(hoje(), i))
  return (
    <div className={styles.dias} role="group" aria-label="Escolha o dia">
      {lista.map((d, i) => (
        <button
          key={d}
          type="button"
          className={d === dia ? `${styles.pilula} ${styles.pilulaDia}` : styles.pilula}
          aria-pressed={d === dia}
          onClick={() => onEscolher(d)}
        >
          {i === 0 ? 'Hoje' : diaDaSemana(d)}
        </button>
      ))}
    </div>
  )
}
