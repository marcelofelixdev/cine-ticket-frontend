import { useState, type FormEvent } from 'react'
import { mensagemDeErro } from '../../lib/erros'
import { diaMes, hora, moeda, NOME_DA_FORMA, NOME_DO_CANAL, NOME_DO_STATUS, NOME_DO_TIPO } from '../../lib/formato'
import type { CanalVenda, StatusIngresso } from '../../lib/tipos'
import { useCarregar } from '../../lib/useCarregar'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import styles from '../Painel.module.css'
import { cancelarVenda, ingressosDoCinema, type FiltroDeIngressos, type IngressoDoPainel } from './gerenteApi'

const STATUS = Object.keys(NOME_DO_STATUS) as StatusIngresso[]
const CANAIS = Object.keys(NOME_DO_CANAL) as CanalVenda[]

/** Ingressos do cinema com filtros; venda de balcão pode ser cancelada com devolução no caixa. */
export function IngressosPage() {
  const [filtro, setFiltro] = useState<FiltroDeIngressos>({})
  const [rascunho, setRascunho] = useState<FiltroDeIngressos>({})
  const [pagina, setPagina] = useState(0)
  const ingressos = useCarregar(
    (signal) => ingressosDoCinema(filtro, pagina, signal),
    JSON.stringify([filtro, pagina]),
  )
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function filtrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFiltro({ ...rascunho, email: rascunho.email?.trim() || undefined })
    setPagina(0)
  }

  async function cancelar(ingresso: IngressoDoPainel) {
    setErro(null)
    setMensagem(null)
    try {
      await cancelarVenda(ingresso.id)
      setMensagem(`Venda #${ingresso.id} cancelada. Devolva ${moeda(ingresso.valorPago)} ao cliente.`)
      ingressos.recarregar()
    } catch (e) {
      setErro(mensagemDeErro(e))
    }
  }

  const info = ingressos.dados?.page
  return (
    <section className={styles.janela} aria-labelledby="ingressos">
      <h1 id="ingressos" className={styles.janelaTitulo}>
        Ingressos do cinema
      </h1>
      <div className={styles.janelaCorpo}>
        <form className={styles.acoes} onSubmit={filtrar} aria-label="Filtros" style={{ alignItems: 'flex-end' }}>
          <label className={styles.campo}>
            Dia da sessão
            <input type="date" value={rascunho.date ?? ''} onChange={(e) => setRascunho({ ...rascunho, date: e.target.value || undefined })} />
          </label>
          <label className={styles.campo}>
            Situação
            <select
              value={rascunho.status ?? ''}
              onChange={(e) => setRascunho({ ...rascunho, status: (e.target.value || undefined) as StatusIngresso | undefined })}
            >
              <option value="">Todas</option>
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {NOME_DO_STATUS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.campo}>
            Canal
            <select
              value={rascunho.canal ?? ''}
              onChange={(e) => setRascunho({ ...rascunho, canal: (e.target.value || undefined) as CanalVenda | undefined })}
            >
              <option value="">Todos</option>
              {CANAIS.map((c) => (
                <option key={c} value={c}>
                  {NOME_DO_CANAL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.campo}>
            E-mail do cliente
            <input value={rascunho.email ?? ''} onChange={(e) => setRascunho({ ...rascunho, email: e.target.value })} />
          </label>
          <button type="submit" className={styles.botao}>
            Filtrar
          </button>
        </form>
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
        {ingressos.erro && <p className={styles.alerta}>{ingressos.erro}</p>}
        {ingressos.dados?.content.length === 0 && <p>Nenhum ingresso com esses filtros.</p>}
        {ingressos.dados && ingressos.dados.content.length > 0 && (
          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Sessão</th>
                  <th scope="col">Lugar</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Canal</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">
                    <span className="visually-hidden">Ação</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ingressos.dados.content.map((i) => (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>
                      {i.filmeTitulo} · {diaMes(i.horarioSessao)} {hora(i.horarioSessao)} · {i.salaNome}
                    </td>
                    <td>{i.assento}</td>
                    <td>{NOME_DO_TIPO[i.tipo]}</td>
                    <td>
                      {NOME_DO_CANAL[i.canal]}
                      {i.formaPagamento && ` · ${NOME_DA_FORMA[i.formaPagamento]}`}
                      {i.vendidoPor && <div className={styles.dica}>por {i.vendidoPor}</div>}
                    </td>
                    <td>{moeda(i.valorPago)}</td>
                    <td>
                      {NOME_DO_STATUS[i.status]}
                      {i.utilizadoEm && <div className={styles.dica}>entrou às {hora(i.utilizadoEm)}</div>}
                      {i.reembolso && <div className={styles.dica}>reembolso: {i.reembolso}</div>}
                    </td>
                    <td>{i.clienteEmail ?? '—'}</td>
                    <td>
                      {i.canal === 'BALCAO' && i.status === 'APPROVED' && !i.utilizadoEm && (
                        <ConfirmarEmDoisPassos
                          rotulo="Cancelar venda"
                          confirmar="Sim, cancelar e devolver"
                          onConfirmar={() => cancelar(i)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && info.totalPages > 1 && (
          <div className={styles.paginacao}>
            <button type="button" className={styles.botao} disabled={info.number === 0} onClick={() => setPagina(info.number - 1)}>
              ◄ Anterior
            </button>
            <span>
              Página {info.number + 1} de {info.totalPages} ({info.totalElements} ingressos)
            </span>
            <button
              type="button"
              className={styles.botao}
              disabled={info.number + 1 >= info.totalPages}
              onClick={() => setPagina(info.number + 1)}
            >
              Próxima ►
            </button>
          </div>
        )}
        <p className={styles.dica}>
          Só vendas de balcão podem ser canceladas aqui, antes do início da sessão. Compras online o cliente cancela pelo
          site.
        </p>
      </div>
    </section>
  )
}
