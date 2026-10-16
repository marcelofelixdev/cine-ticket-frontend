import { montarFileiras, type Assento } from '../../lib/assentos'
import painel from '../Painel.module.css'
import styles from './Admin.module.css'

interface Props {
  capacidade: number
  cadeirasPorFila: number
  corredores: number[]
}

/** Acima disso a prévia não é desenhada (a API aceita até 1000 lugares). */
const LIMITE_DA_PREVIA = 1000

/**
 * Desenho da sala antes de salvar, na mesma ordem em que a API gera as cadeiras:
 * fila A de 1 até cadeirasPorFila, depois B… Quem valida (filas, corredores) é a API.
 */
export function PreviaDaSala({ capacidade, cadeirasPorFila, corredores }: Props) {
  if (!(capacidade > 0 && cadeirasPorFila > 0) || capacidade > LIMITE_DA_PREVIA) {
    return <p>Informe a capacidade e as cadeiras por fila para ver a prévia.</p>
  }
  const assentos: Assento[] = Array.from({ length: capacidade }, (_, i) => ({
    id: i,
    fila: String.fromCharCode(65 + Math.floor(i / cadeirasPorFila)),
    numero: (i % cadeirasPorFila) + 1,
    status: 'LIVRE',
  }))
  const fileiras = montarFileiras(assentos, corredores)
  const resumo = `${capacidade} lugares em ${fileiras.length} filas (A a ${fileiras.at(-1)?.fila})`
  return (
    <>
      <div className={styles.previa} role="img" aria-label={`Prévia da sala: ${resumo}`}>
        <div className={styles.tela}>TELA</div>
        {fileiras.map((fileira) => (
          <div key={fileira.fila} className={styles.fileira}>
            <span className={styles.letra}>{fileira.fila}</span>
            {fileira.assentos.map((a) => (
              <span key={a.id} className={a.corredorAntes ? `${styles.cadeira} ${styles.corredor}` : styles.cadeira} />
            ))}
          </div>
        ))}
      </div>
      <p className={painel.dica}>Prévia: {resumo}.</p>
    </>
  )
}
