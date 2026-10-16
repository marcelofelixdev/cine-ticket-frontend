import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { dataCompleta, duracao, hoje, hora, moeda, versao } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import { Classificacao } from '../Classificacao'
import { useLocal } from '../local'
import { SeletorDeDia } from '../SeletorDeDia'
import { filme as buscarFilme, sessoesDoFilmeNaCidade, type Filme, type SessaoPublica } from '../siteApi'
import siteStyles from '../Site.module.css'
import styles from './Filme.module.css'

/** Abaixo disso o card avisa "últimos lugares". */
const POUCOS_LUGARES = 10

/** Ficha do filme e as sessões dele nos cinemas da cidade escolhida. */
export function FilmePage() {
  const id = Number(useParams().id)
  const ficha = useCarregar((signal) => buscarFilme(id, signal), String(id))

  if (ficha.erro) {
    return (
      <main className={siteStyles.pagina}>
        <h1 className={siteStyles.titulo}>Filme não encontrado</h1>
        <p>{ficha.erro}</p>
        <Link to="/">Voltar para a programação</Link>
      </main>
    )
  }
  if (!ficha.dados) {
    return (
      <main className={siteStyles.pagina}>
        <p role="status">Carregando o filme…</p>
      </main>
    )
  }
  return <Ficha filme={ficha.dados} />
}

function Ficha({ filme }: { filme: Filme }) {
  const [trailer, setTrailer] = useState(false)
  const estreou = filme.dataEstreia !== null && filme.dataEstreia <= hoje()
  const generos = filme.generos?.join(', ')
  const animacao = filme.generos?.includes('Animação')

  return (
    <>
      <section
        aria-label="Destaque do filme"
        className={styles.destaque}
        style={filme.backdropUrl ? { backgroundImage: `url(${filme.backdropUrl})` } : undefined}
      >
        {filme.posterUrl ? (
          <img src={filme.posterUrl} alt={`Pôster de ${filme.titulo}`} className={styles.poster} />
        ) : (
          <span className={styles.poster} aria-hidden="true" />
        )}
        <div className={styles.cartela}>
          <div className={styles.selos}>
            <Classificacao valor={filme.classificacao} />
            {filme.dataEstreia && (
              <span className={styles.estreia}>
                {estreou ? 'Em cartaz desde' : 'Estreia em'} {dataCompleta(filme.dataEstreia)}
              </span>
            )}
          </div>
          <h1 className={styles.titulo}>{filme.titulo}</h1>
          <p className={styles.meta}>
            {[filme.tituloOriginal !== filme.titulo ? filme.tituloOriginal : null, generos, duracao(filme.duracaoEmMinutos)]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <div className={styles.acoes}>
            <a href="#sessoes" className={styles.botaoPrincipal}>
              Ver sessões
            </a>
            {filme.trailerUrl && (
              <button type="button" className={styles.botao} aria-expanded={trailer} onClick={() => setTrailer(!trailer)}>
                {trailer ? 'Fechar trailer' : 'Assistir ao trailer'}
              </button>
            )}
          </div>
        </div>
      </section>
      {trailer && filme.trailerUrl && <Trailer url={filme.trailerUrl} titulo={filme.titulo} />}

      <main className={`${siteStyles.pagina} ${styles.corpo}`}>
        <div className={styles.principal}>
          {filme.sinopse && (
            <section aria-labelledby="sinopse">
              <h2 id="sinopse" className={styles.subtitulo}>
                Sinopse
              </h2>
              <p className={styles.sinopse}>{filme.sinopse}</p>
            </section>
          )}
          {filme.elenco && filme.elenco.length > 0 && (
            <section aria-labelledby="elenco">
              <h2 id="elenco" className={styles.subtitulo}>
                {animacao ? 'Vozes' : 'Elenco principal'}
              </h2>
              <ul className={styles.elenco}>
                {filme.elenco.map((pessoa) => (
                  <li key={pessoa.nome}>
                    {pessoa.fotoUrl ? (
                      <img src={pessoa.fotoUrl} alt="" className={styles.foto} loading="lazy" />
                    ) : (
                      <span className={styles.iniciais} aria-hidden="true">
                        {iniciais(pessoa.nome)}
                      </span>
                    )}
                    <strong>{pessoa.nome}</strong>
                    {pessoa.personagem && <span>{pessoa.personagem}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <Sessoes filme={filme} />
        </div>

        <aside aria-labelledby="ficha" className={styles.ficha}>
          <h2 id="ficha" className={styles.subtitulo}>
            Ficha técnica
          </h2>
          <dl>
            {filme.diretor && <Linha rotulo="Direção" valor={filme.diretor} />}
            {filme.produtora && <Linha rotulo="Produção" valor={filme.produtora} />}
            {generos && <Linha rotulo="Gêneros" valor={generos} />}
            {filme.duracaoEmMinutos && (
              <Linha rotulo="Duração" valor={`${duracao(filme.duracaoEmMinutos)} (${filme.duracaoEmMinutos} min)`} />
            )}
            {filme.dataEstreia && <Linha rotulo="Estreia" valor={dataCompleta(filme.dataEstreia)} />}
            {filme.tituloOriginal && <Linha rotulo="Título original" valor={filme.tituloOriginal} />}
            {filme.classificacao && (
              <Linha rotulo="Classificação" valor={filme.classificacao === 'L' ? 'Livre' : `${filme.classificacao} anos`} />
            )}
          </dl>
          <p className={styles.meia}>
            <strong>Meia-entrada:</strong> estudantes com carteira e pessoas com 60 anos ou mais, com número limitado
            por sessão. Cada horário mostra quantas meias ainda restam.
          </p>
          <p className={styles.fonte}>Dados e imagens do TMDB.</p>
        </aside>
      </main>
    </>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </>
  )
}

function iniciais(nome: string): string {
  const partes = nome.split(' ').filter(Boolean)
  return `${partes[0]?.[0] ?? ''}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`
}

/** Player do YouTube (sem cookies) aberto na própria página. */
function Trailer({ url, titulo }: { url: string; titulo: string }) {
  const chave = new URL(url).searchParams.get('v')
  if (!chave) {
    return null
  }
  return (
    <div className={styles.trailer}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${chave}?autoplay=1`}
        title={`Trailer de ${titulo}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

/** Sessões do dia em cada cinema da cidade escolhida no cabeçalho. */
function Sessoes({ filme }: { filme: Filme }) {
  const { cidade, cinemasDaCidade } = useLocal()
  const [dia, setDia] = useState(hoje())
  const sessoes = useCarregar(
    cidade ? (signal) => sessoesDoFilmeNaCidade(filme.id, cidade.cidade, dia, signal) : null,
    `${filme.id}-${dia}-${cidade?.cidade}`,
  )
  // A API manda as sessões da cidade em ordem de horário; aqui só separamos por cinema.
  const porCinema = new Map<number, SessaoPublica[]>()
  for (const s of sessoes.dados?.content ?? []) {
    porCinema.set(s.cinemaId, [...(porCinema.get(s.cinemaId) ?? []), s])
  }
  const comSessao = cinemasDaCidade.filter((c) => porCinema.has(c.id))

  return (
    <section id="sessoes" aria-labelledby="sessoes-titulo">
      <div className={styles.cabecalhoSessoes}>
        <h2 id="sessoes-titulo" className={styles.subtitulo}>
          {cidade ? `Sessões em ${cidade.cidade}` : 'Sessões'}
        </h2>
        <SeletorDeDia dia={dia} onEscolher={setDia} />
      </div>
      {sessoes.erro && <p role="alert">{sessoes.erro}</p>}
      {sessoes.dados && comSessao.length === 0 && (
        <p>{dia === hoje() ? 'Não há mais sessões deste filme hoje na cidade.' : 'Nenhuma sessão deste filme neste dia na cidade.'}</p>
      )}
      <div className={styles.cinemas}>
        {comSessao.map((c) => (
          <div key={c.id} className={styles.cinema}>
            <div className={styles.cinemaCabecalho}>
              <span className={styles.cinemaNome}>{c.nome}</span>
              <span>{c.endereco}</span>
            </div>
            <div className={styles.horarios}>
              {(porCinema.get(c.id) ?? []).map((s) => (
                <CartaoDeSessao key={s.id} sessao={s} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CartaoDeSessao({ sessao }: { sessao: SessaoPublica }) {
  const livres = sessao.lugaresLivres
  const esgotada = livres === 0
  const conteudo = (
    <>
      <span className={styles.sessaoTopo}>
        <span className={styles.sessaoHora}>{hora(sessao.horarioInicio)}</span>
        <span className={styles.versao}>{versao(sessao.formato, sessao.audio)}</span>
      </span>
      <span>
        {sessao.roomNome} · {moeda(sessao.valorBase)} (meia {moeda(sessao.valorMeia)})
      </span>
      {typeof livres === 'number' && (
        <span className={livres <= POUCOS_LUGARES ? styles.poucos : styles.livres}>
          {esgotada ? 'Esgotada' : livres <= POUCOS_LUGARES ? `Últimos ${livres} lugares` : `${livres} lugares livres`}
          {!esgotada && typeof sessao.meiasRestantes === 'number' && ` · ${sessao.meiasRestantes} meias`}
        </span>
      )}
    </>
  )
  if (esgotada) {
    return <div className={`${styles.sessao} ${styles.sessaoEsgotada}`}>{conteudo}</div>
  }
  return (
    <Link to={`/sessoes/${sessao.id}`} className={styles.sessao}>
      {conteudo}
    </Link>
  )
}
