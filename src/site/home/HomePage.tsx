import { useState } from 'react'
import { Link } from 'react-router'
import { dataCompleta, diaDaSemana, duracao, hoje, somarDias } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import { Classificacao } from '../Classificacao'
import { HorarioDaSessao } from '../HorarioDaSessao'
import { useLocal } from '../local'
import { RoloDeDestaques } from './RoloDeDestaques'
import { emBreve, filmesEmCartaz, sessoesDoDia, type Filme, type FiltroDaVitrine, type SessaoPublica } from '../siteApi'
import siteStyles from '../Site.module.css'
import styles from './Home.module.css'

/** Quantos filmes entram no rolo de destaques. */
const DESTAQUES = 5
const DIAS = 7

interface Opcao {
  rotulo: string
  filtro: FiltroDaVitrine
}

/** Atalhos de filtro; quem filtra é a API (filmes e sessões). */
const OPCOES: Opcao[] = [
  { rotulo: '3D', filtro: { formato: '3D' } },
  { rotulo: 'Dublado', filtro: { audio: 'DUBLADO' } },
  { rotulo: 'Legendado', filtro: { audio: 'LEGENDADO' } },
  { rotulo: 'Nacional', filtro: { audio: 'NACIONAL' } },
  { rotulo: 'Livre para todos', filtro: { classificacao: 'L' } },
]

function ativa(filtro: FiltroDaVitrine, opcao: Opcao): boolean {
  return Object.entries(opcao.filtro).every(([chave, valor]) => filtro[chave as keyof FiltroDaVitrine] === valor)
}

/** Liga ou desliga um atalho; áudio é um só por vez. */
function alternar(filtro: FiltroDaVitrine, opcao: Opcao): FiltroDaVitrine {
  if (ativa(filtro, opcao)) {
    const sem = { ...filtro }
    for (const chave of Object.keys(opcao.filtro)) {
      delete sem[chave as keyof FiltroDaVitrine]
    }
    return sem
  }
  return { ...filtro, ...opcao.filtro }
}

export function HomePage() {
  const { cidade, cinema, cinemasDaCidade, escolherCinema } = useLocal()
  const [dia, setDia] = useState(hoje())
  const [filtro, setFiltro] = useState<FiltroDaVitrine>({})
  const chaveDoFiltro = JSON.stringify(filtro)

  const filmes = useCarregar(
    cinema ? (signal) => filmesEmCartaz(cinema.id, filtro, signal) : null,
    `${cinema?.id}-${chaveDoFiltro}`,
  )
  const sessoes = useCarregar(
    cinema ? (signal) => sessoesDoDia(cinema.id, dia, filtro, signal) : null,
    `${cinema?.id}-${dia}-${chaveDoFiltro}`,
  )
  const breve = useCarregar(cidade ? (signal) => emBreve(cidade.cidade, signal) : null, cidade?.cidade ?? '')

  const sessoesPorFilme = new Map<number, SessaoPublica[]>()
  for (const s of sessoes.dados?.content ?? []) {
    sessoesPorFilme.set(s.movieId, [...(sessoesPorFilme.get(s.movieId) ?? []), s])
  }
  const listaDeFilmes = filmes.dados?.content ?? []
  // Destaques: filmes com sessão no dia primeiro, depois os demais.
  const destaques = [...listaDeFilmes]
    .sort((a, b) => Number(sessoesPorFilme.has(b.id)) - Number(sessoesPorFilme.has(a.id)))
    .slice(0, DESTAQUES)
  // Quadro do dia: filmes na ordem da primeira sessão.
  const quadro = [...sessoesPorFilme.entries()]
  const ehHoje = dia === hoje()
  const dias = Array.from({ length: DIAS }, (_, i) => somarDias(hoje(), i))

  return (
    <main className={siteStyles.pagina}>
      <section aria-labelledby="em-cartaz" className={styles.destaques}>
        <div className={styles.cabecalho}>
          <h1 id="em-cartaz" className={siteStyles.titulo}>
            {cinema ? `Em cartaz no ${cinema.nome}` : 'Em cartaz'}
          </h1>
          {cinema && (
            <p>
              {cinema.endereco} · <a href="#cinemas">trocar de cinema</a>
            </p>
          )}
        </div>
        {filmes.erro && <p role="alert">{filmes.erro}</p>}
        <RoloOuAviso carregando={filmes.carregando && !filmes.dados} filmes={destaques} sessoesPorFilme={sessoesPorFilme} />
      </section>

      <div className={styles.controles}>
        <div className={styles.dias} role="group" aria-label="Escolha o dia">
          {dias.map((d, i) => (
            <button
              key={d}
              type="button"
              className={d === dia ? `${styles.pilula} ${styles.pilulaDia}` : styles.pilula}
              aria-pressed={d === dia}
              onClick={() => setDia(d)}
            >
              {i === 0 ? 'Hoje' : diaDaSemana(d)}
            </button>
          ))}
        </div>
        <div className={styles.filtros} role="group" aria-label="Filtros">
          <button
            type="button"
            className={Object.keys(filtro).length === 0 ? `${styles.pilula} ${styles.pilulaAtiva}` : styles.pilula}
            aria-pressed={Object.keys(filtro).length === 0}
            onClick={() => setFiltro({})}
          >
            Todos
          </button>
          {OPCOES.map((opcao) => (
            <button
              key={opcao.rotulo}
              type="button"
              className={ativa(filtro, opcao) ? `${styles.pilula} ${styles.pilulaAtiva}` : styles.pilula}
              aria-pressed={ativa(filtro, opcao)}
              onClick={() => setFiltro(alternar(filtro, opcao))}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <section aria-labelledby="quadro" className={styles.moldura}>
        <div className={styles.quadroDoDia}>
          <div className={styles.cabecalho}>
            <h2 id="quadro" className={styles.subtitulo}>
              {ehHoje ? 'Hoje' : `${diaDaSemana(dia)}/${dataCompleta(dia).slice(3, 5)}`}, sessão por sessão
            </h2>
            <span className={styles.legenda}>DUB dublado · LEG legendado · NAC nacional</span>
          </div>
          {sessoes.erro && <p role="alert">{sessoes.erro}</p>}
          {sessoes.dados && quadro.length === 0 && (
            <p>{ehHoje ? 'Não há mais sessões hoje com esses filtros.' : 'Nenhuma sessão neste dia com esses filtros.'}</p>
          )}
          {quadro.map(([movieId, lista]) => (
            <div key={movieId} className={styles.linhaDoQuadro}>
              <Link to={`/filmes/${movieId}`} className={styles.filmeDoQuadro}>
                {lista[0].movieTitulo}
              </Link>
              <div className={styles.horarios}>
                {lista.map((s) => (
                  <HorarioDaSessao key={s.id} sessao={s} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="todos" className={styles.secao}>
        <h2 id="todos" className={styles.subtitulo}>
          Todos os filmes em cartaz
        </h2>
        {filmes.dados && listaDeFilmes.length === 0 && <p>Nenhum filme em cartaz com esses filtros.</p>}
        <div className={styles.grade}>
          {listaDeFilmes.map((filme) => (
            <CartaoDoFilme key={filme.id} filme={filme} sessoes={sessoesPorFilme.get(filme.id) ?? []} />
          ))}
        </div>
      </section>

      {breve.dados && breve.dados.content.length > 0 && (
        <section aria-labelledby="breve" className={styles.secao}>
          <div className={styles.cabecalho}>
            <h2 id="breve" className={styles.subtitulo}>
              Em breve
            </h2>
            <span>Pela data de estreia. Sem horários ainda.</span>
          </div>
          <div className={styles.gradeBreve}>
            {breve.dados.content.map((filme) => (
              <Link key={filme.id} to={`/filmes/${filme.id}`} className={styles.breve}>
                {filme.posterUrl ? (
                  <img src={filme.posterUrl} alt="" className={styles.posterBreve} />
                ) : (
                  <span className={styles.posterBreve} aria-hidden="true" />
                )}
                <span className={styles.breveTexto}>
                  <span className={styles.breveTitulo}>{filme.titulo}</span>
                  {filme.generos && <span>{filme.generos.slice(0, 2).join(', ')}</span>}
                  {filme.dataEstreia && <span className={styles.estreia}>Estreia {dataCompleta(filme.dataEstreia).slice(0, 5)}</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="cinemas" aria-labelledby="cinemas-titulo" className={`${styles.secao} ${styles.cinemas}`}>
        <h2 id="cinemas-titulo" className={styles.subtitulo}>
          {cidade ? `Cinemas em ${cidade.cidade}` : 'Cinemas'}
        </h2>
        <div className={styles.gradeCinemas}>
          {cinemasDaCidade.map((c) => (
            <div key={c.id} className={styles.cinema}>
              <span className={styles.cinemaNome}>{c.nome}</span>
              <span>{c.endereco}</span>
              {c.id === cinema?.id ? (
                <strong className={styles.cinemaAtual}>Você está vendo este cinema</strong>
              ) : (
                <button type="button" className={styles.trocar} onClick={() => escolherCinema(c.id)}>
                  Ver a programação
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

interface RoloProps {
  carregando: boolean
  filmes: Filme[]
  sessoesPorFilme: Map<number, SessaoPublica[]>
}

function RoloOuAviso({ carregando, filmes, sessoesPorFilme }: RoloProps) {
  if (carregando) {
    return <div className={styles.carregando} role="status">Carregando a programação…</div>
  }
  if (filmes.length === 0) {
    return null
  }
  return <RoloDeDestaques filmes={filmes} sessoesPorFilme={sessoesPorFilme} />
}

function CartaoDoFilme({ filme, sessoes }: { filme: Filme; sessoes: SessaoPublica[] }) {
  const imagem = filme.backdropUrl ?? filme.posterUrl
  return (
    <article className={styles.cartao}>
      <Link
        to={`/filmes/${filme.id}`}
        className={styles.capa}
        style={imagem ? { backgroundImage: `url(${imagem})` } : undefined}
      >
        <Classificacao valor={filme.classificacao} />
        <span className={styles.capaTitulo}>{filme.titulo}</span>
      </Link>
      <div className={styles.cartaoCorpo}>
        <span>
          {[filme.generos?.[0], duracao(filme.duracaoEmMinutos)].filter(Boolean).join(' · ')}
        </span>
        <div className={styles.horarios}>
          {sessoes.length === 0 ? (
            <span className={styles.semSessao}>Sem sessões neste dia</span>
          ) : (
            sessoes.map((s) => <HorarioDaSessao key={s.id} sessao={s} />)
          )}
        </div>
      </div>
    </article>
  )
}
