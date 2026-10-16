import { somarDias } from '../../lib/formato'
import styles from '../Painel.module.css'

/** Dia anterior, seletor de data e próximo dia (caixa e sessões do gerente). */
export function NavegacaoDeDia({ dia, onTrocar }: { dia: string; onTrocar: (dia: string) => void }) {
  return (
    <div className={styles.navegacaoDia}>
      <button type="button" className={styles.botao} onClick={() => onTrocar(somarDias(dia, -1))}>
        ◄ Dia anterior
      </button>
      <input type="date" aria-label="Dia" value={dia} onChange={(e) => e.target.value && onTrocar(e.target.value)} />
      <button type="button" className={styles.botao} onClick={() => onTrocar(somarDias(dia, 1))}>
        Próximo dia ►
      </button>
    </div>
  )
}
