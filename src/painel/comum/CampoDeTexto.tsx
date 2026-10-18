import type { InputHTMLAttributes } from 'react'
import styles from '../Painel.module.css'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  rotulo: string
  valor: string
  onMudar: (valor: string) => void
  /** Erro da API para este campo (422). */
  erro?: string
  /** Classes campo e erroDoCampo de outro CSS module (o site usa o visual dele). */
  estilos?: Readonly<Record<string, string>>
}

/** Rótulo, campo e o erro que a API devolveu para ele. */
export function CampoDeTexto({ rotulo, valor, onMudar, erro, estilos = styles, ...resto }: Props) {
  return (
    <label className={estilos.campo}>
      {rotulo}
      <input {...resto} value={valor} onChange={(e) => onMudar(e.target.value)} />
      {erro && <span className={estilos.erroDoCampo}>{erro}</span>}
    </label>
  )
}
