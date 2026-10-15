import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { rotulo, type Assento } from '../../lib/assentos'
import { ehMeia, hoje, hora, moeda, NOME_DA_FORMA, NOME_DO_TIPO, precoDoTipo, somarDias, versao } from '../../lib/formato'
import type { FormaPagamento, TipoIngresso } from '../../lib/tipos'
import { mensagemDeErro, useCarregar } from '../../lib/useCarregar'
import styles from '../Painel.module.css'
import caixa from './Caixa.module.css'
import { mapaDeAssentos, sessoesDoDia, vender, type SessaoDoDia, type Venda } from './caixaApi'
import { imprimirIngresso } from './imprimir'
import { MapaDeAssentos } from './MapaDeAssentos'
import { SessoesDoDia } from './SessoesDoDia'

/** Limite da API por venda (BoxOfficeSaleRequestDTO). */
const MAX_LUGARES = 10
const TIPOS: TipoIngresso[] = ['INTEIRA', 'MEIA_ESTUDANTE', 'MEIA_IDOSO']
const FORMAS: FormaPagamento[] = ['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO']

interface LugarEscolhido {
  assento: Assento
  tipo: TipoIngresso
  documento: string
}

export function CaixaPage() {
  const [dia, setDia] = useState(hoje())
  const sessoes = useCarregar((signal) => sessoesDoDia(dia, signal), dia)
  const [sessaoId, setSessaoId] = useState<number | null>(null)
  const mapa = useCarregar(
    sessaoId === null ? null : (signal) => mapaDeAssentos(sessaoId, signal),
    String(sessaoId),
  )
  const [lugares, setLugares] = useState<LugarEscolhido[]>([])
  const [venda, setVenda] = useState<Venda | null>(null)

  const sessao = sessoes.dados?.find((s) => s.id === sessaoId) ?? null

  function trocarDia(novo: string) {
    setDia(novo)
    escolherSessao(null)
  }

  function escolherSessao(id: number | null) {
    setSessaoId(id)
    setLugares([])
    setVenda(null)
  }

  function alternar(assento: Assento) {
    setVenda(null)
    setLugares((atuais) => {
      if (atuais.some((l) => l.assento.id === assento.id)) {
        return atuais.filter((l) => l.assento.id !== assento.id)
      }
      if (atuais.length >= MAX_LUGARES) {
        return atuais
      }
      return [...atuais, { assento, tipo: 'INTEIRA', documento: '' }]
    })
  }

  function vendaConcluida(resultado: Venda) {
    setVenda(resultado)
    setLugares([])
    mapa.recarregar()
    sessoes.recarregar()
  }

  return (
    <div className={caixa.layout}>
      <section className={`${styles.janela} ${caixa.colunaSessoes}`} aria-labelledby="sessoes-dia">
        <h1 id="sessoes-dia" className={styles.janelaTitulo}>
          Sessões · {dia.split('-').reverse().join('/')}
        </h1>
        <div className={styles.janelaCorpo}>
          <div className={caixa.navegacaoDia}>
            <button type="button" className={styles.botao} onClick={() => trocarDia(somarDias(dia, -1))}>
              ◄ Dia anterior
            </button>
            <input type="date" aria-label="Dia" value={dia} onChange={(e) => e.target.value && trocarDia(e.target.value)} />
            <button type="button" className={styles.botao} onClick={() => trocarDia(somarDias(dia, 1))}>
              Próximo dia ►
            </button>
          </div>
          {sessoes.erro && <p className={styles.alerta}>{sessoes.erro}</p>}
          {sessoes.carregando && !sessoes.dados && <p className={styles.dica}>Carregando…</p>}
          {sessoes.dados && (
            <SessoesDoDia sessoes={sessoes.dados} selecionada={sessaoId} onEscolher={escolherSessao} />
          )}
          <p className={styles.dica}>Sessões com as vendas encerradas aparecem marcadas na lista.</p>
        </div>
      </section>

      <section className={`${styles.janela} ${caixa.colunaMapa}`} aria-labelledby="mapa-titulo">
        <h2 id="mapa-titulo" className={styles.janelaTitulo}>
          {sessao
            ? `${sessao.movieTitulo} · ${hora(sessao.horarioInicio)} · ${sessao.roomNome} · ${versao(sessao.formato, sessao.audio)} · ${moeda(sessao.valorBase)}`
            : 'Mapa de assentos'}
        </h2>
        <div className={styles.janelaCorpo}>
          {!sessao && <p className={styles.dica}>Escolha uma sessão na lista.</p>}
          {mapa.erro && <p className={styles.alerta}>{mapa.erro}</p>}
          {sessao && mapa.dados && (
            <MapaDeAssentos
              assentos={mapa.dados.assentos}
              corredores={mapa.dados.corredores}
              selecionados={new Set(lugares.map((l) => l.assento.id))}
              bloqueado={!sessao.vendasAbertas}
              onAlternar={alternar}
            />
          )}
        </div>
      </section>

      <section className={`${styles.janela} ${caixa.colunaVenda}`} aria-labelledby="venda-titulo">
        <h2 id="venda-titulo" className={styles.janelaTitulo}>
          Venda
        </h2>
        <div className={styles.janelaCorpo}>
          {venda && <Recibo venda={venda} />}
          {sessao && mapa.dados && lugares.length > 0 && (
            <FormularioDeVenda
              sessao={sessao}
              meiasRestantes={mapa.dados.meiasRestantes}
              lugares={lugares}
              onMudarLugares={setLugares}
              onConcluida={vendaConcluida}
            />
          )}
          {!venda && lugares.length === 0 && (
            <p className={styles.dica}>Clique nos lugares livres do mapa (até {MAX_LUGARES} por venda).</p>
          )}
        </div>
      </section>
    </div>
  )
}

interface FormularioProps {
  sessao: SessaoDoDia
  meiasRestantes: number
  lugares: LugarEscolhido[]
  onMudarLugares: (lugares: LugarEscolhido[]) => void
  onConcluida: (venda: Venda) => void
}

function FormularioDeVenda({ sessao, meiasRestantes, lugares, onMudarLugares, onConcluida }: FormularioProps) {
  const [forma, setForma] = useState<FormaPagamento>('DINHEIRO')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const meias = lugares.filter((l) => ehMeia(l.tipo)).length
  const total = lugares.reduce((soma, l) => soma + precoDoTipo(sessao, l.tipo), 0)
  const passouDaCota = meias > meiasRestantes

  function mudar(id: number, mudanca: Partial<LugarEscolhido>) {
    onMudarLugares(lugares.map((l) => (l.assento.id === id ? { ...l, ...mudanca } : l)))
  }

  async function concluir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const venda = await vender({
        sessionId: sessao.id,
        formaPagamento: forma,
        clienteEmail: email.trim() || undefined,
        itens: lugares.map((l) => ({
          seatId: l.assento.id,
          ticketType: l.tipo,
          documentoMeia: l.tipo === 'MEIA_ESTUDANTE' ? l.documento.trim() : undefined,
        })),
      })
      onConcluida(venda)
    } catch (e) {
      setErro(e instanceof ApiError && e.status === 409 ? `${e.message} Atualize o mapa e escolha outro lugar.` : mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={concluir} noValidate className={styles.janelaCorpo} style={{ padding: 0 }}>
      {erro && (
        <p className={styles.alerta} role="alert">
          {erro}
        </p>
      )}
      <fieldset className={caixa.grupo}>
        <legend>Lugares ({lugares.length})</legend>
        {lugares.map((l) => (
          <div key={l.assento.id} className={caixa.item}>
            <strong>{rotulo(l.assento)}</strong>
            <select
              aria-label={`Tipo do lugar ${rotulo(l.assento)}`}
              value={l.tipo}
              onChange={(e) => mudar(l.assento.id, { tipo: e.target.value as TipoIngresso })}
            >
              {TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {NOME_DO_TIPO[tipo]}
                </option>
              ))}
            </select>
            <span className={caixa.preco}>{moeda(precoDoTipo(sessao, l.tipo))}</span>
            {l.tipo === 'MEIA_ESTUDANTE' && (
              <input
                aria-label={`Carteira de estudante do lugar ${rotulo(l.assento)}`}
                placeholder="Nº da carteira de estudante"
                value={l.documento}
                onChange={(e) => mudar(l.assento.id, { documento: e.target.value })}
              />
            )}
          </div>
        ))}
        <p className={styles.dica}>
          Meias que ainda cabem nesta sessão: {meiasRestantes}. Meia 60+: confira um documento com foto.
        </p>
      </fieldset>
      {passouDaCota && (
        <p className={styles.aviso} role="status">
          Esta venda tem {meias} meias, mas só cabem {meiasRestantes}. Troque alguma para inteira.
        </p>
      )}
      <fieldset className={caixa.grupo}>
        <legend>Pagamento</legend>
        <div className={caixa.formas}>
          {FORMAS.map((f) => (
            <label key={f}>
              <input type="radio" name="forma" value={f} checked={forma === f} onChange={() => setForma(f)} />{' '}
              {NOME_DA_FORMA[f]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={caixa.campoLinha}>
        E-mail do cliente (opcional)
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@exemplo.com" />
      </label>
      <p className={styles.dica}>Se o e-mail tiver conta, os ingressos também aparecem em "Meus ingressos" do cliente.</p>
      <div className={caixa.total}>
        <span>Total</span>
        <strong>{moeda(total)}</strong>
      </div>
      <button type="submit" className={styles.botaoPrincipal} disabled={enviando || passouDaCota}>
        {enviando ? 'Vendendo…' : 'Concluir venda'}
      </button>
    </form>
  )
}

function Recibo({ venda }: { venda: Venda }) {
  const [erro, setErro] = useState<string | null>(null)

  async function imprimir(ticketId: number) {
    setErro(null)
    try {
      await imprimirIngresso(ticketId)
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  return (
    <div className={caixa.grupo} role="status">
      <p className={styles.sucesso}>
        Venda concluída: {moeda(venda.total)} em {NOME_DA_FORMA[venda.formaPagamento].toLowerCase()}.
      </p>
      {erro && <p className={styles.alerta}>{erro}</p>}
      {venda.ingressos.map((ingresso) => (
        <div key={ingresso.ticketId} className={caixa.item}>
          <strong>{ingresso.assento}</strong>
          <span style={{ flex: '1 1 auto' }}>
            {NOME_DO_TIPO[ingresso.tipo]} · {moeda(ingresso.valor)}
          </span>
          <button type="button" className={styles.botao} onClick={() => void imprimir(ingresso.ticketId)}>
            Imprimir
          </button>
        </div>
      ))}
    </div>
  )
}
