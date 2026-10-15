import { Link } from 'react-router'
import { hora, versao } from '../lib/formato'
import type { SessaoPublica } from './siteApi'
import styles from './Site.module.css'

interface Props {
  sessao: SessaoPublica
  /** Botão claro sobre fundo escuro (vitrine). */
  claro?: boolean
}

/** Horário clicável que leva à escolha de lugares da sessão. */
export function HorarioDaSessao({ sessao, claro = false }: Props) {
  const lotada = sessao.lugaresLivres === 0
  return (
    <Link
      to={`/sessoes/${sessao.id}`}
      className={claro ? styles.horarioClaro : styles.horario}
      aria-label={`${sessao.movieTitulo} às ${hora(sessao.horarioInicio)}, ${versao(sessao.formato, sessao.audio)}${lotada ? ', esgotada' : ''}`}
    >
      <strong>{hora(sessao.horarioInicio)}</strong>
      <span>{lotada ? 'esgotada' : versao(sessao.formato, sessao.audio)}</span>
    </Link>
  )
}
