import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { duracao } from '../../lib/formato'
import { Classificacao } from '../Classificacao'
import { HorarioDaSessao } from '../HorarioDaSessao'
import type { Filme, SessaoPublica } from '../siteApi'
import styles from './Home.module.css'

/** Tempo de cada destaque, igual à animação da barrinha. */
const TROCA_MS = 6000

interface Props {
  filmes: Filme[]
  sessoesPorFilme: Map<number, SessaoPublica[]>
}

function prefereMenosMovimento(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Vitrine em "rolo de filme": um destaque aberto por vez, que troca sozinho a cada 6 s.
 * Para quando o mouse ou o foco estão nela; com "reduzir movimento", não troca sozinha.
 */
export function RoloDeDestaques({ filmes, sessoesPorFilme }: Props) {
  const [destaque, setDestaque] = useState(0)
  const [pausado, setPausado] = useState(false)
  const total = filmes.length

  useEffect(() => {
    if (pausado || total < 2 || prefereMenosMovimento()) {
      return
    }
    const timer = setTimeout(() => setDestaque((atual) => (atual + 1) % total), TROCA_MS)
    return () => clearTimeout(timer)
  }, [destaque, pausado, total])

  if (total === 0) {
    return null
  }
  const atual = destaque % total

  return (
    <>
      <div className={styles.palco}>
        <div className={styles.cortina} aria-hidden="true" />
        <div
          className={styles.rolo}
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={() => setPausado(false)}
        >
          {filmes.map((filme, i) => (
            <Quadro
              key={filme.id}
              filme={filme}
              sessoes={sessoesPorFilme.get(filme.id) ?? []}
              aberto={i === atual}
            />
          ))}
        </div>
        <div className={styles.cortina} aria-hidden="true" />
      </div>
      <div className={styles.pontos} role="group" aria-label="Escolher destaque">
        {filmes.map((filme, i) => (
          <button
            key={filme.id}
            type="button"
            className={i === atual ? `${styles.ponto} ${styles.pontoAtual}` : styles.ponto}
            aria-label={`Destacar ${filme.titulo}`}
            aria-pressed={i === atual}
            onClick={() => setDestaque(i)}
          >
            {/* A chave reinicia a animação da barrinha a cada troca. */}
            <b>
              <i key={i === atual ? `on-${atual}-${pausado}` : 'off'} />
            </b>
          </button>
        ))}
      </div>
    </>
  )
}

interface QuadroProps {
  filme: Filme
  sessoes: SessaoPublica[]
  aberto: boolean
}

function Quadro({ filme, sessoes, aberto }: QuadroProps) {
  const fundo = filme.backdropUrl ?? filme.posterUrl
  const elenco = (filme.elenco ?? []).slice(0, 3).map((p) => p.nome)
  const animacao = filme.generos?.includes('Animação')
  const meta = [filme.generos?.slice(0, 2).join(', '), duracao(filme.duracaoEmMinutos)].filter(Boolean).join(' · ')
  return (
    <article
      className={aberto ? `${styles.quadro} ${styles.quadroAberto}` : styles.quadro}
      style={fundo ? { backgroundImage: `url(${fundo})` } : undefined}
      tabIndex={0}
      aria-label={filme.titulo}
    >
      <div className={styles.fechado} aria-hidden={aberto}>
        <Classificacao valor={filme.classificacao} />
        <span className={styles.vertical}>{filme.titulo}</span>
      </div>
      <div className={styles.aberto}>
        <div className={styles.abertoTexto}>
          <div className={styles.linhaMeta}>
            <Classificacao valor={filme.classificacao} />
            <span>{meta}</span>
          </div>
          <h2 className={styles.tituloDestaque}>{filme.titulo}</h2>
          {filme.sinopse && <p className={styles.sinopse}>{filme.sinopse}</p>}
          <dl className={styles.creditos}>
            {filme.diretor && (
              <>
                <dt>Direção</dt>
                <dd>{filme.diretor}</dd>
              </>
            )}
            {elenco.length > 0 && (
              <>
                <dt>{animacao ? 'Vozes' : 'Elenco'}</dt>
                <dd>{elenco.join(', ')}</dd>
              </>
            )}
            {filme.produtora && (
              <>
                <dt>Produção</dt>
                <dd>{filme.produtora}</dd>
              </>
            )}
          </dl>
          <div className={styles.horarios}>
            {sessoes.map((s) => (
              <HorarioDaSessao key={s.id} sessao={s} claro />
            ))}
            <Link to={`/filmes/${filme.id}`} className={styles.ficha}>
              Trailer e ficha completa
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
