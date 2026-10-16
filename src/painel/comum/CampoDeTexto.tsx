import type { InputHTMLAttributes } from 'react'
import styles from '../Painel.module.css'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  rotulo: string
  valor: string
  onMudar: (valor: string) => void
  /** Erro da API para este campo (422). */
  erro?: string
}

/** Rótulo, campo e o erro que a API devolveu para ele. */
export function CampoDeTexto({ rotulo, valor, onMudar, erro, ...resto }: Props) {
  return (
    <label className={styles.campo}>
      {rotulo}
      <input {...resto} value={valor} onChange={(e) => onMudar(e.target.value)} />
      {erro && <span className={styles.erroDoCampo}>{erro}</span>}
    </label>
  )
}
