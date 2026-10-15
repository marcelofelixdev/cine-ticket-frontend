import { useState, type FormEvent, type ReactNode } from 'react'
import type { Pagina } from '../../api/pagina'
import { diaMes, hora, moeda, NOME_DA_FORMA, NOME_DO_CANAL, NOME_DO_STATUS, NOME_DO_TIPO } from '../../lib/formato'
import type { CanalVenda, StatusIngresso } from '../../lib/tipos'
import { useCarregar } from '../../lib/useCarregar'
import styles from '../Painel.module.css'
import { Paginacao } from './Paginacao'
import type { FiltroDeIngressos, IngressoDoPainel } from './painelApi'

const STATUS = Object.keys(NOME_DO_STATUS) as StatusIngresso[]
const CANAIS = Object.keys(NOME_DO_CANAL) as CanalVenda[]

interface Props {
  titulo: string
  buscar: (filtro: FiltroDeIngressos, pagina: number, signal: AbortSignal) => Promise<Pagina<IngressoDoPainel>>
  /** Com a lista, aparece o filtro por cinema (admin). */
  cinemas?: Array<{ id: number; nome: string }>
  /** Conteúdo da última coluna de cada linha; `recarregar` busca a página de novo. */
  acao?: (ingresso: IngressoDoPainel, recarregar: () => void) => ReactNode
  /** Entre os filtros e a tabela (avisos da ação). */
  children?: ReactNode
  rodape?: ReactNode
}

/** Ingressos com filtros e paginação feitos pela API (gerente e admin). */
export function ListaDeIngressos({ titulo, buscar, cinemas, acao, children, rodape }: Props) {
  const [filtro, setFiltro] = useState<FiltroDeIngressos>({})
  const [rascunho, setRascunho] = useState<FiltroDeIngressos>({})
  const [pagina, setPagina] = useState(0)
  const ingressos = useCarregar((signal) => buscar(filtro, pagina, signal), JSON.stringify([filtro, pagina]))

  function filtrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFiltro({ ...rascunho, email: rascunho.email?.trim() || undefined })
    setPagina(0)
  }

  return (
    <section className={styles.janela} aria-labelledby="ingressos">
      <h1 id="ingressos" className={styles.janelaTitulo}>
        {titulo}
      </h1>
      <div className={styles.janelaCorpo}>
        <form className={styles.acoes} onSubmit={filtrar} aria-label="Filtros" style={{ alignItems: 'flex-end' }}>
          {cinemas && (
            <label className={styles.campo}>
              Cinema
              <select
                value={rascunho.cinemaId ?? ''}
                onChange={(e) => setRascunho({ ...rascunho, cinemaId: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
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
        {children}
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
                  {acao && (
                    <th scope="col">
                      <span className="visually-hidden">Ação</span>
                    </th>
                  )}
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
                    {acao && <td>{acao(i, ingressos.recarregar)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacao info={ingressos.dados?.page} itens="ingressos" onMudar={setPagina} />
        {rodape}
      </div>
    </section>
  )
}
