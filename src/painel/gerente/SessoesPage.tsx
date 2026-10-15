import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { errosPorCampo, mensagemDeErro } from '../../lib/erros'
import { dataCompleta, duracao, hoje, hora, moeda, NOME_DA_FORMA, nomeDoAudio, versao } from '../../lib/formato'
import { AUDIOS, FORMATOS, type Audio, type FormaPagamento, type Formato } from '../../lib/tipos'
import { useCarregar } from '../../lib/useCarregar'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import { NavegacaoDeDia } from '../comum/NavegacaoDeDia'
import type { SessaoDoDia } from '../comum/sessaoDoDia'
import styles from '../Painel.module.css'
import {
  cancelarSessao,
  criarSessao,
  programacao,
  resumoDaSessao,
  salasDoCinema,
  sessoesDoGerente,
} from './gerenteApi'

export function SessoesPage() {
  const [dia, setDia] = useState(hoje())
  const sessoes = useCarregar((signal) => sessoesDoGerente(dia, signal), dia)
  const [resumoId, setResumoId] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function trocarDia(novo: string) {
    setDia(novo)
    setResumoId(null)
  }

  async function cancelar(sessao: SessaoDoDia) {
    setErro(null)
    setMensagem(null)
    try {
      await cancelarSessao(sessao.id)
      setMensagem(
        `Sessão das ${hora(sessao.horarioInicio)} de ${sessao.movieTitulo} cancelada. ` +
          'Compras online foram estornadas e as vendas de balcão foram para Devoluções.',
      )
      sessoes.recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  return (
    <div className={styles.colunas}>
      <div className={styles.colunaLarga} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <section className={styles.janela} aria-labelledby="sessoes">
          <h1 id="sessoes" className={styles.janelaTitulo}>
            Sessões · {dataCompleta(dia)}
          </h1>
          <div className={styles.janelaCorpo}>
            <NavegacaoDeDia dia={dia} onTrocar={trocarDia} />
            {mensagem && (
              <p className={styles.sucesso} role="status">
                {mensagem}
              </p>
            )}
            {erro && (
              <p className={styles.alerta} role="alert">
                {erro}
              </p>
            )}
            {sessoes.erro && <p className={styles.alerta}>{sessoes.erro}</p>}
            {sessoes.dados?.length === 0 && <p>Nenhuma sessão neste dia.</p>}
            {sessoes.dados && sessoes.dados.length > 0 && (
              <TabelaDeSessoes
                sessoes={sessoes.dados}
                onResumo={(id) => setResumoId(id === resumoId ? null : id)}
                onCancelar={cancelar}
              />
            )}
            <p className={styles.dica}>
              Cancelar uma sessão cancela os ingressos: compras online são estornadas no cartão e vendas de balcão
              ficam como devolução pendente no caixa.
            </p>
          </div>
        </section>
        {resumoId !== null && <ResumoDaSessaoView id={resumoId} />}
      </div>
      <div className={styles.colunaEstreita}>
        <FormularioDeSessao
          diaInicial={dia}
          onCriada={(dataCriada) => {
            if (dataCriada === dia) {
              sessoes.recarregar()
            }
          }}
        />
      </div>
    </div>
  )
}

interface TabelaProps {
  sessoes: SessaoDoDia[]
  onResumo: (id: number) => void
  onCancelar: (sessao: SessaoDoDia) => Promise<void>
}

function TabelaDeSessoes({ sessoes, onResumo, onCancelar }: TabelaProps) {
  const receitaDoDia = sessoes.reduce((soma, s) => soma + (s.receita ?? 0), 0)
  const ingressosDoDia = sessoes.reduce((soma, s) => soma + s.ocupados, 0)
  return (
    <>
      <p style={{ margin: 0, fontSize: 13 }}>
        Receita do dia: <strong>{moeda(receitaDoDia)}</strong> · {ingressosDoDia} lugares ocupados
      </p>
      <div className={styles.rolagem}>
        <table className={styles.tabela}>
          <thead>
            <tr>
              <th scope="col">Hora</th>
              <th scope="col">Filme</th>
              <th scope="col">Sala</th>
              <th scope="col">Sessão</th>
              <th scope="col">Ocupação</th>
              <th scope="col">Meias</th>
              <th scope="col">Receita</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sessoes.map((s) => {
              const porcentagem = s.lugares ? Math.round((s.ocupados / s.lugares) * 100) : 0
              return (
                <tr key={s.id}>
                  <td>
                    <strong>{hora(s.horarioInicio)}</strong>
                  </td>
                  <td>{s.movieTitulo}</td>
                  <td>{s.roomNome}</td>
                  <td>{versao(s.formato, s.audio)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={porcentagem >= 90 ? `${styles.barra} ${styles.barraCheia}` : styles.barra} aria-hidden="true">
                      <span style={{ width: `${porcentagem}%` }} />
                    </span>
                    {s.ocupados}/{s.lugares}
                  </td>
                  <td>{s.meias}</td>
                  <td>{moeda(s.receita ?? 0)}</td>
                  <td>
                    <span className={styles.acoes}>
                      <button
                        type="button"
                        className={styles.botao}
                        aria-label={`Resumo da sessão das ${hora(s.horarioInicio)}`}
                        onClick={() => onResumo(s.id)}
                      >
                        Resumo
                      </button>
                      <ConfirmarEmDoisPassos
                        rotulo="Cancelar"
                        confirmar="Sim, cancelar sessão"
                        onConfirmar={() => onCancelar(s)}
                      />
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

function ResumoDaSessaoView({ id }: { id: number }) {
  const resumo = useCarregar((signal) => resumoDaSessao(id, signal), String(id))
  const r = resumo.dados
  return (
    <section className={styles.janela} aria-labelledby="resumo">
      <h2 id="resumo" className={styles.janelaTitulo}>
        {r ? `Resumo · ${r.filmeTitulo} · ${hora(r.horarioSessao)} · ${r.salaNome}` : 'Resumo da sessão'}
      </h2>
      <div className={styles.janelaCorpo}>
        {resumo.erro && <p className={styles.alerta}>{resumo.erro}</p>}
        {r && (
          <table className={styles.tabela}>
            <tbody>
              <tr>
                <th scope="row">Lugares</th>
                <td>
                  {r.lugares} · {r.vendidos} vendidos · {r.reservados} reservados · {r.livres} livres
                </td>
              </tr>
              <tr>
                <th scope="row">Meias</th>
                <td>{r.meias}</td>
              </tr>
              <tr>
                <th scope="row">Entradas na sala</th>
                <td>{r.entradas}</td>
              </tr>
              <tr>
                <th scope="row">Receita</th>
                <td>
                  {moeda(r.receitaTotal)} (online {moeda(r.receitaOnline)}, balcão {moeda(r.receitaBalcao)})
                </td>
              </tr>
              <tr>
                <th scope="row">Balcão por forma</th>
                <td>
                  {Object.entries(r.receitaBalcaoPorForma)
                    .map(([forma, valor]) => `${NOME_DA_FORMA[forma as FormaPagamento]} ${moeda(valor ?? 0)}`)
                    .join(' · ') || '—'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

interface FormularioProps {
  diaInicial: string
  onCriada: (dia: string) => void
}

function FormularioDeSessao({ diaInicial, onCriada }: FormularioProps) {
  const filmes = useCarregar((signal) => programacao(signal), 'programacao')
  const salas = useCarregar((signal) => salasDoCinema(signal), 'salas')
  const [filme, setFilme] = useState('')
  const [sala, setSala] = useState('')
  const [dia, setDia] = useState(diaInicial)
  const [inicio, setInicio] = useState('19:00')
  const [formato, setFormato] = useState<Formato>('2D')
  const [audio, setAudio] = useState<Audio>('LEGENDADO')
  const [preco, setPreco] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [criada, setCriada] = useState<string | null>(null)

  const emCartaz = filmes.dados?.filter((f) => f.status === 'ATIVO') ?? []

  async function criar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnviando(true)
    setErro(null)
    setErros({})
    setCriada(null)
    try {
      await criarSessao({
        movieId: Number(filme),
        roomId: Number(sala),
        horarioInicio: `${dia}T${inicio}:00`,
        valorBase: Number(preco.replace(',', '.')),
        formato,
        audio,
      })
      setCriada(`Sessão criada para ${dataCompleta(dia)} às ${inicio}.`)
      onCriada(dia)
    } catch (e) {
      setErro(e instanceof ApiError && e.status === 409 ? e.message : mensagemDeErro(e))
      setErros(errosPorCampo(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={styles.janela} aria-labelledby="nova-sessao">
      <h2 id="nova-sessao" className={styles.janelaTitulo}>
        Nova sessão
      </h2>
      <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={criar}>
        {criada && (
          <p className={styles.sucesso} role="status">
            {criada}
          </p>
        )}
        {erro && (
          <p className={styles.alerta} role="alert">
            {erro}
          </p>
        )}
        <label className={styles.campo}>
          Filme (em cartaz neste cinema)
          <select required value={filme} onChange={(e) => setFilme(e.target.value)}>
            <option value="">Escolha…</option>
            {emCartaz.map((f) => (
              <option key={f.movieId} value={f.movieId}>
                {f.titulo} ({duracao(f.duracaoEmMinutos)})
              </option>
            ))}
          </select>
        </label>
        <label className={styles.campo}>
          Sala
          <select required value={sala} onChange={(e) => setSala(e.target.value)}>
            <option value="">Escolha…</option>
            {salas.dados?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.capacidade} lugares)
              </option>
            ))}
          </select>
        </label>
        <div className={styles.duasColunas}>
          <label className={styles.campo}>
            Data
            <input type="date" required value={dia} onChange={(e) => setDia(e.target.value)} />
          </label>
          <label className={styles.campo}>
            Início
            <input type="time" required value={inicio} onChange={(e) => setInicio(e.target.value)} />
            {erros.horarioInicio && <span className={styles.erroDoCampo}>{erros.horarioInicio}</span>}
          </label>
          <label className={styles.campo}>
            Formato
            <select value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
              {FORMATOS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className={styles.campo}>
            Áudio
            <select value={audio} onChange={(e) => setAudio(e.target.value as Audio)}>
              {AUDIOS.map((a) => (
                <option key={a} value={a}>
                  {nomeDoAudio(a)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={styles.campo}>
          Preço da inteira (R$)
          <input inputMode="decimal" required value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="38,00" />
          {erros.valorBase && <span className={styles.erroDoCampo}>{erros.valorBase}</span>}
        </label>
        <p className={styles.dica}>A API confere se a sala está livre no horário (filme mais a limpeza).</p>
        <button type="submit" className={styles.botaoPrincipal} disabled={enviando}>
          {enviando ? 'Criando…' : 'Criar sessão'}
        </button>
      </form>
    </section>
  )
}
