import styles from './Site.module.css'

/** Cores da ClassInd, escurecidas onde o texto branco não teria contraste (o 12 usa texto escuro). */
const CLASSE: Record<string, string> = {
  L: styles.classeL,
  '10': styles.classe10,
  '12': styles.classe12,
  '14': styles.classe14,
  '16': styles.classe16,
  '18': styles.classe18,
}

const DESCRICAO: Record<string, string> = {
  L: 'Livre para todos os públicos',
  '10': 'Não recomendado para menores de 10 anos',
  '12': 'Não recomendado para menores de 12 anos',
  '14': 'Não recomendado para menores de 14 anos',
  '16': 'Não recomendado para menores de 16 anos',
  '18': 'Não recomendado para menores de 18 anos',
}

export function Classificacao({ valor }: { valor: string | null }) {
  if (!valor || !CLASSE[valor]) {
    return null
  }
  return (
    <span className={`${styles.classificacao} ${CLASSE[valor]}`} title={DESCRICAO[valor]}>
      <span aria-hidden="true">{valor}</span>
      <span className="visually-hidden">{DESCRICAO[valor]}</span>
    </span>
  )
}
