import { useState, type FormEvent } from 'react'
import { duracao } from '../../lib/formato'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { BuscaNoTmdb } from '../comum/BuscaNoTmdb'
import { CampoDeTexto } from '../comum/CampoDeTexto'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import { Paginacao } from '../comum/Paginacao'
import { NOME_DA_SITUACAO_NA_PROGRAMACAO } from '../comum/painelApi'
import { useAcao, type Acao } from '../../lib/useAcao'
import styles from '../Painel.module.css'
import {
  cadastrarDoTmdb,
  catalogo,
  corrigirFilme,
  enviarAosCinemas,
  excluirFilme,
  fichaDoFilme,
  sincronizarComTmdb,
  todosOsCinemas,
  type FichaDoFilme,
  type FilmeDoCatalogo,
} from './adminApi'

const CLASSIFICACOES = ['L', '10', '12', '14', '16', '18']

type Aberto = { filme: FilmeDoCatalogo; modo: 'enviar' | 'corrigir' }

/** Catálogo da rede: cadastrar pelo TMDB, enviar aos cinemas, corrigir, sincronizar e excluir. */
export function FilmesPage() {
  const [pagina, setPagina] = useState(0)
  const filmes = useCarregar((signal) => catalogo(pagina, signal), String(pagina))
  const [aberto, setAberto] = useState<Aberto | null>(null)
  const acao = useAcao()

  async function executar(chamada: () => Promise<string>) {
    if (await acao.executar(chamada)) {
      filmes.recarregar()
    }
  }

  return (
    <div className={styles.colunas}>
      <section className={`${styles.janela} ${styles.colunaLarga}`} aria-labelledby="catalogo">
        <h1 id="catalogo" className={styles.janelaTitulo}>
          Catálogo da rede
        </h1>
        <div className={styles.janelaCorpo}>
          <Avisos sucesso={acao.sucesso} erro={acao.erro} />
          {filmes.erro && <p className={styles.alerta}>{filmes.erro}</p>}
          {filmes.dados?.content.length === 0 && <p>Nenhum filme no catálogo. Cadastre pelo TMDB.</p>}
          {filmes.dados && filmes.dados.content.length > 0 && (
            <div className={styles.rolagem}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="visually-hidden">Pôster</span>
                    </th>
                    <th scope="col">Filme</th>
                    <th scope="col">Cinemas</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filmes.dados.content.map((f) => (
                    <tr key={f.id}>
                      <td>{f.posterUrl ? <img className={styles.poster} src={f.posterUrl} alt="" /> : null}</td>
                      <td>
                        <strong>{f.titulo}</strong>
                        <div className={styles.dica}>
                          {duracao(f.duracaoEmMinutos)} · {f.classificacao ?? 'sem classificação'}
                        </div>
                      </td>
                      <td>
                        {f.cinemas.length === 0
                          ? 'Em nenhum cinema'
                          : f.cinemas.map((c) => (
                              <div key={c.cinemaId}>
                                {c.cinemaNome}: {NOME_DA_SITUACAO_NA_PROGRAMACAO[c.status]}
                              </div>
                            ))}
                      </td>
                      <td>
                        <div className={styles.acoes}>
                          <button
                            type="button"
                            className={styles.botao}
                            aria-label={`Enviar ${f.titulo} aos cinemas`}
                            onClick={() => setAberto({ filme: f, modo: 'enviar' })}
                          >
                            Enviar
                          </button>
                          <button
                            type="button"
                            className={styles.botao}
                            aria-label={`Corrigir ${f.titulo}`}
                            onClick={() => setAberto({ filme: f, modo: 'corrigir' })}
                          >
                            Corrigir
                          </button>
                          {f.tmdbId && (
                            <button
                              type="button"
                              className={styles.botao}
                              aria-label={`Atualizar ${f.titulo} pelo TMDB`}
                              disabled={acao.enviando}
                              onClick={() =>
                                void executar(async () => {
                                  await sincronizarComTmdb(f.id)
                                  return `${f.titulo} atualizado com os dados do TMDB.`
                                })
                              }
                            >
                              TMDB
                            </button>
                          )}
                          <ConfirmarEmDoisPassos
                            rotulo="Excluir"
                            confirmar={`Sim, excluir ${f.titulo}`}
                            onConfirmar={() =>
                              executar(async () => {
                                await excluirFilme(f.id)
                                if (aberto?.filme.id === f.id) {
                                  setAberto(null)
                                }
                                return `${f.titulo} excluído do catálogo.`
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao info={filmes.dados?.page} itens="filmes" onMudar={setPagina} />
        </div>
      </section>

      <div className={`${styles.colunaEstreita} ${styles.formulario}`}>
        {aberto?.modo === 'enviar' && (
          <EnviarAosCinemas
            key={aberto.filme.id}
            filme={aberto.filme}
            onFechar={() => setAberto(null)}
            onEnviado={filmes.recarregar}
          />
        )}
        {aberto?.modo === 'corrigir' && (
          <CorrigirFilme
            key={aberto.filme.id}
            filme={aberto.filme}
            onFechar={() => setAberto(null)}
            onCorrigido={filmes.recarregar}
          />
        )}
        <section className={styles.janela} aria-labelledby="cadastrar">
          <h2 id="cadastrar" className={styles.janelaTitulo}>
            Cadastrar filme do TMDB
          </h2>
          <div className={styles.janelaCorpo}>
            <BuscaNoTmdb
              acao="Cadastrar"
              onEscolher={(filme) =>
                executar(async () => {
                  await cadastrarDoTmdb(filme.tmdbId)
                  return `${filme.titulo} cadastrado. Envie aos cinemas pela lista.`
                })
              }
            />
          </div>
        </section>
      </div>
    </div>
  )
}

interface EnviarProps {
  filme: FilmeDoCatalogo
  onFechar: () => void
  onEnviado: () => void
}

/** Envia o filme aos cinemas marcados; em cada um ele espera a confirmação do gerente. */
function EnviarAosCinemas({ filme, onFechar, onEnviado }: EnviarProps) {
  const rede = useCarregar((signal) => todosOsCinemas(signal), 'cinemas')
  const [marcados, setMarcados] = useState<Set<number>>(new Set())
  const acao = useAcao()
  const situacao = new Map(filme.cinemas.map((c) => [c.cinemaId, c.status]))

  function alternar(id: number) {
    const novos = new Set(marcados)
    if (novos.has(id)) {
      novos.delete(id)
    } else {
      novos.add(id)
    }
    setMarcados(novos)
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await acao.executar(async () => {
      await enviarAosCinemas(filme.id, [...marcados])
      return `${filme.titulo} enviado. Cada gerente confirma na programação do cinema.`
    })
    if (ok) {
      setMarcados(new Set())
      onEnviado()
    }
  }

  return (
    <section className={styles.janela} aria-labelledby="enviar">
      <h2 id="enviar" className={styles.janelaTitulo}>
        Enviar {filme.titulo} aos cinemas
      </h2>
      <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={enviar}>
        <Avisos sucesso={acao.sucesso} erro={acao.erro} />
        {rede.erro && <p className={styles.alerta}>{rede.erro}</p>}
        <fieldset className={styles.grupo}>
          <legend>Para quais cinemas</legend>
          {rede.dados?.content.map((c) => {
            const status = situacao.get(c.id)
            return (
              <label key={c.id}>
                <input
                  type="checkbox"
                  checked={status !== undefined || marcados.has(c.id)}
                  disabled={status !== undefined}
                  onChange={() => alternar(c.id)}
                />{' '}
                {c.nome} ({c.cidade}){status && ` · ${NOME_DA_SITUACAO_NA_PROGRAMACAO[status]}`}
              </label>
            )
          })}
        </fieldset>
        <div className={styles.acoes}>
          <button type="submit" className={styles.botaoPrincipal} disabled={acao.enviando}>
            {acao.enviando ? 'Enviando…' : 'Enviar'}
          </button>
          <button type="button" className={styles.botao} onClick={onFechar}>
            Fechar
          </button>
        </div>
      </form>
    </section>
  )
}

interface CorrigirProps {
  filme: FilmeDoCatalogo
  onFechar: () => void
  onCorrigido: () => void
}

/** Correção à mão dos dados do filme; campos vazios ficam como estão na API. */
function CorrigirFilme({ filme, onFechar, onCorrigido }: CorrigirProps) {
  const ficha = useCarregar((signal) => fichaDoFilme(filme.id, signal), String(filme.id))
  const acao = useAcao()
  return (
    <section className={styles.janela} aria-labelledby="corrigir">
      <h2 id="corrigir" className={styles.janelaTitulo}>
        Corrigir {filme.titulo}
      </h2>
      <div className={styles.janelaCorpo}>
        {ficha.erro && <p className={styles.alerta}>{ficha.erro}</p>}
        {ficha.dados && <FormularioDeCorrecao ficha={ficha.dados} acao={acao} onFechar={onFechar} onCorrigido={onCorrigido} />}
      </div>
    </section>
  )
}

interface FormularioProps {
  ficha: FichaDoFilme
  acao: Acao
  onFechar: () => void
  onCorrigido: () => void
}

function FormularioDeCorrecao({ ficha, acao, onFechar, onCorrigido }: FormularioProps) {
  const [titulo, setTitulo] = useState(ficha.titulo ?? '')
  const [minutos, setMinutos] = useState(ficha.duracaoEmMinutos ? String(ficha.duracaoEmMinutos) : '')
  const [classificacao, setClassificacao] = useState(ficha.classificacao ?? '')
  const [estreia, setEstreia] = useState(ficha.dataEstreia ?? '')
  const [sinopse, setSinopse] = useState(ficha.sinopse ?? '')

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await acao.executar(async () => {
      await corrigirFilme(ficha.id, {
        titulo: titulo.trim() || null,
        duracaoEmMinutos: minutos ? Number(minutos) : null,
        classificacao: classificacao || null,
        dataEstreia: estreia || null,
        sinopse: sinopse.trim() || null,
      })
      return 'Filme corrigido.'
    })
    if (ok) {
      onCorrigido()
    }
  }

  return (
    <form className={styles.formulario} onSubmit={salvar} noValidate>
      <Avisos sucesso={acao.sucesso} erro={acao.erro} />
      <CampoDeTexto rotulo="Título" valor={titulo} onMudar={setTitulo} erro={acao.erros.titulo} />
      <div className={styles.duasColunas}>
        <CampoDeTexto
          rotulo="Duração (min)"
          inputMode="numeric"
          valor={minutos}
          onMudar={setMinutos}
          erro={acao.erros.duracaoEmMinutos}
        />
        <label className={styles.campo}>
          Classificação
          <select value={classificacao} onChange={(e) => setClassificacao(e.target.value)}>
            <option value="">—</option>
            {CLASSIFICACOES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <CampoDeTexto rotulo="Estreia" type="date" valor={estreia} onMudar={setEstreia} erro={acao.erros.dataEstreia} />
      <label className={styles.campo}>
        Sinopse
        <textarea rows={5} value={sinopse} onChange={(e) => setSinopse(e.target.value)} />
        {acao.erros.sinopse && <span className={styles.erroDoCampo}>{acao.erros.sinopse}</span>}
      </label>
      <div className={styles.acoes}>
        <button type="submit" className={styles.botaoPrincipal} disabled={acao.enviando}>
          {acao.enviando ? 'Salvando…' : 'Salvar correção'}
        </button>
        <button type="button" className={styles.botao} onClick={onFechar}>
          Fechar
        </button>
      </div>
    </form>
  )
}
