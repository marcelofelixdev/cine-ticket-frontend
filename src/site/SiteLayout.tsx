import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Logo'
import { useCarregar } from '../lib/useCarregar'
import { guardarEscolha, lerEscolha, LocalContext, type EscolhaGuardada } from './local'
import { cidades, cinemasDaCidade, type Cidade } from './siteApi'
import styles from './Site.module.css'

const chaveDaCidade = (c: Cidade) => `${c.cidade}/${c.uf}`

/** Cabeçalho com cidade e cinema, conteúdo e rodapé com a atribuição do TMDB. */
export function SiteLayout() {
  const { sessao } = useAuth()
  const [escolha, setEscolha] = useState<EscolhaGuardada>(lerEscolha)
  const listaDeCidades = useCarregar((signal) => cidades(signal), 'cidades')

  const opcoesDeCidade = listaDeCidades.dados ?? []
  const cidade =
    opcoesDeCidade.find((c) => c.cidade === escolha.cidade && c.uf === escolha.uf) ?? opcoesDeCidade[0] ?? null
  const cinemas = useCarregar(
    cidade ? (signal) => cinemasDaCidade(cidade.cidade, signal) : null,
    cidade ? chaveDaCidade(cidade) : '',
  )
  const cinemasDaCidadeAtual = cinemas.dados?.content ?? []
  const cinema = cinemasDaCidadeAtual.find((c) => c.id === escolha.cinemaId) ?? cinemasDaCidadeAtual[0] ?? null

  function escolher(nova: EscolhaGuardada) {
    guardarEscolha(nova)
    setEscolha(nova)
  }

  function escolherCidade(chave: string) {
    const nova = opcoesDeCidade.find((c) => chaveDaCidade(c) === chave)
    if (nova) {
      escolher({ cidade: nova.cidade, uf: nova.uf })
    }
  }

  function escolherCinema(cinemaId: number) {
    escolher({ cidade: cidade?.cidade, uf: cidade?.uf, cinemaId })
  }

  const local = { cidade, cinema, cinemasDaCidade: cinemasDaCidadeAtual, escolherCinema }

  return (
    <LocalContext.Provider value={local}>
      <div className={styles.site}>
        <header className={styles.topo}>
          <div className={styles.topoConteudo}>
            <Link to="/" className={styles.marca} aria-label="CineTicket, página inicial">
              <Logo />
            </Link>
            <nav aria-label="Principal" className={styles.menu}>
              <NavLink to="/" end>
                Filmes
              </NavLink>
              <a href="/#cinemas">Cinemas</a>
              <NavLink to="/meus-ingressos">Meus ingressos</NavLink>
            </nav>
            <div className={styles.escolhas}>
              <label>
                Cidade
                <select
                  value={cidade ? chaveDaCidade(cidade) : ''}
                  onChange={(e) => escolherCidade(e.target.value)}
                  disabled={opcoesDeCidade.length === 0}
                >
                  {opcoesDeCidade.map((c) => (
                    <option key={chaveDaCidade(c)} value={chaveDaCidade(c)}>
                      {c.cidade}, {c.uf}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cinema
                <select
                  value={cinema?.id ?? ''}
                  onChange={(e) => escolherCinema(Number(e.target.value))}
                  disabled={cinemasDaCidadeAtual.length === 0}
                >
                  {cinemasDaCidadeAtual.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {sessao.status === 'logado' ? (
              <Link to="/meus-ingressos" className={styles.entrar}>
                Olá, {sessao.usuario.nome.split(' ')[0]}
              </Link>
            ) : (
              <Link to="/entrar" className={styles.entrar}>
                Entrar
              </Link>
            )}
          </div>
        </header>
        <div className={styles.recorte} aria-hidden="true" />

        {listaDeCidades.erro && (
          <p className={styles.falha} role="alert">
            Não foi possível carregar a programação. {listaDeCidades.erro}
          </p>
        )}
        <Outlet />

        <footer className={styles.rodape}>
          <div className={styles.rodapeConteudo}>
            <Logo className={styles.rodapeLogo} />
            <span className={styles.tmdb}>
              <span className={styles.tmdbSelo}>TMDB</span>
              Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
            </span>
            <Link to="/painel">Área da equipe</Link>
          </div>
        </footer>
      </div>
    </LocalContext.Provider>
  )
}
