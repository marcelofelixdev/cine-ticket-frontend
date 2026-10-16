import { useState, type FormEvent } from 'react'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { CampoDeTexto } from '../comum/CampoDeTexto'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import { Paginacao } from '../comum/Paginacao'
import { useAcao } from '../../lib/useAcao'
import styles from '../Painel.module.css'
import { criarSala, editarSala, excluirSala, salas, todosOsCinemas, type SalaDaRede } from './adminApi'
import { PreviaDaSala } from './PreviaDaSala'

interface Props {
  /** Muda quando a lista de cinemas muda (o seletor busca de novo). */
  versaoDosCinemas: number
}

/** Salas de todos os cinemas, com o cadastro e a edição dos corredores. */
export function Salas({ versaoDosCinemas }: Props) {
  const [pagina, setPagina] = useState(0)
  const [versao, setVersao] = useState(0)
  const [filtro, setFiltro] = useState('')
  const lista = useCarregar(
    (signal) => salas(pagina, filtro, signal),
    `${pagina}-${filtro}-${versao}-${versaoDosCinemas}`,
  )
  const rede = useCarregar((signal) => todosOsCinemas(signal), `cinemas-${versaoDosCinemas}`)
  const [editando, setEditando] = useState<SalaDaRede | null>(null)
  const acao = useAcao()

  return (
    <div className={styles.colunas}>
      <section className={`${styles.janela} ${styles.colunaLarga}`} aria-labelledby="salas">
        <h2 id="salas" className={styles.janelaTitulo}>
          Salas
        </h2>
        <div className={styles.janelaCorpo}>
          <label className={styles.campo} style={{ maxWidth: 260 }}>
            Mostrar o cinema
            <select
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value)
                setPagina(0)
              }}
            >
              <option value="">Todos</option>
              {rede.dados?.content.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <Avisos sucesso={acao.sucesso} erro={acao.erro} />
          {lista.erro && <p className={styles.alerta}>{lista.erro}</p>}
          {lista.dados?.content.length === 0 && <p>Nenhuma sala cadastrada.</p>}
          {lista.dados && lista.dados.content.length > 0 && (
            <div className={styles.rolagem}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th scope="col">Cinema</th>
                    <th scope="col">Sala</th>
                    <th scope="col">Lugares</th>
                    <th scope="col">Cadeiras por fila</th>
                    <th scope="col">Corredores depois das cadeiras</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lista.dados.content.map((s) => (
                    <tr key={s.id}>
                      <td>{s.cinemaNome}</td>
                      <td>{s.nome}</td>
                      <td>{s.capacidade}</td>
                      <td>{s.cadeirasPorFila}</td>
                      <td>{s.corredores.join(', ') || '—'}</td>
                      <td>
                        <div className={styles.acoes}>
                          <button
                            type="button"
                            className={styles.botao}
                            aria-label={`Editar ${s.nome} do ${s.cinemaNome}`}
                            onClick={() => setEditando(s)}
                          >
                            Editar
                          </button>
                          <ConfirmarEmDoisPassos
                            rotulo="Excluir"
                            confirmar={`Sim, excluir ${s.nome}`}
                            onConfirmar={async () => {
                              const ok = await acao.executar(async () => {
                                await excluirSala(s.id)
                                return `${s.nome} do ${s.cinemaNome} excluída.`
                              })
                              if (ok) {
                                setEditando(null)
                                setVersao((v) => v + 1)
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginacao info={lista.dados?.page} itens="salas" onMudar={setPagina} />
        </div>
      </section>
      <FormularioDeSala
        key={editando?.id ?? 'nova'}
        sala={editando}
        cinemas={rede.dados?.content ?? []}
        onSalva={(salva) => {
          setEditando((atual) => (atual ? salva : null))
          setVersao((v) => v + 1)
        }}
        onCancelar={() => setEditando(null)}
      />
    </div>
  )
}

/** "3, 9" → [3, 9]. O que não for número segue para a API recusar. */
function lerCorredores(texto: string): number[] {
  return texto
    .split(/[\s,;]+/)
    .filter(Boolean)
    .map(Number)
}

/** A API aponta o erro na lista ("corredores") ou num item ("corredores[1]"). */
function erroDosCorredores(erros: Record<string, string>): string | undefined {
  return Object.entries(erros).find(([campo]) => campo === 'corredores' || campo.startsWith('corredores['))?.[1]
}

interface FormularioProps {
  /** Nula: sala nova. */
  sala: SalaDaRede | null
  cinemas: Array<{ id: number; nome: string }>
  onSalva: (sala: SalaDaRede) => void
  onCancelar: () => void
}

function FormularioDeSala({ sala, cinemas, onSalva, onCancelar }: FormularioProps) {
  const [cinemaId, setCinemaId] = useState(sala ? String(sala.cinemaId) : '')
  const [nome, setNome] = useState(sala?.nome ?? '')
  const [capacidade, setCapacidade] = useState(sala ? String(sala.capacidade) : '')
  const [cadeirasPorFila, setCadeirasPorFila] = useState(String(sala?.cadeirasPorFila ?? 10))
  const [corredores, setCorredores] = useState(sala?.corredores.join(', ') ?? '')
  const acao = useAcao()

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const dados = {
      nome: nome.trim(),
      capacidade: Number(capacidade),
      cinemaId: Number(cinemaId),
      cadeirasPorFila: Number(cadeirasPorFila),
      corredores: lerCorredores(corredores),
    }
    await acao.executar(async () => {
      const salva = sala ? await editarSala(sala.id, dados) : await criarSala(dados)
      if (!sala) {
        setNome('')
        setCapacidade('')
        setCorredores('')
      }
      onSalva(salva)
      return `${salva.nome} do ${salva.cinemaNome} salva.`
    })
  }

  return (
    <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="form-sala">
      <h2 id="form-sala" className={styles.janelaTitulo}>
        {sala ? `Editar ${sala.nome} · ${sala.cinemaNome}` : 'Nova sala'}
      </h2>
      <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={salvar} noValidate>
        <Avisos sucesso={acao.sucesso} erro={acao.erro} />
        <label className={styles.campo}>
          Cinema
          <select value={cinemaId} disabled={sala !== null} onChange={(e) => setCinemaId(e.target.value)}>
            <option value="">Escolha</option>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {acao.erros.cinemaId && <span className={styles.erroDoCampo}>{acao.erros.cinemaId}</span>}
        </label>
        <CampoDeTexto rotulo="Nome" valor={nome} onMudar={setNome} erro={acao.erros.nome} />
        <div className={styles.duasColunas}>
          <CampoDeTexto
            rotulo="Capacidade"
            inputMode="numeric"
            disabled={sala !== null}
            valor={capacidade}
            onMudar={setCapacidade}
            erro={acao.erros.capacidade}
          />
          <CampoDeTexto
            rotulo="Cadeiras por fila"
            inputMode="numeric"
            disabled={sala !== null}
            valor={cadeirasPorFila}
            onMudar={setCadeirasPorFila}
            erro={acao.erros.cadeirasPorFila}
          />
        </div>
        <CampoDeTexto
          rotulo="Corredores depois das cadeiras"
          placeholder="ex.: 3, 9"
          valor={corredores}
          onMudar={setCorredores}
          erro={erroDosCorredores(acao.erros)}
        />
        <p className={styles.dica}>
          Capacidade e cadeiras por fila não mudam depois de criar; o nome e os corredores podem ser editados.
        </p>
        <PreviaDaSala
          capacidade={Number(capacidade)}
          cadeirasPorFila={Number(cadeirasPorFila)}
          corredores={lerCorredores(corredores)}
        />
        <div className={styles.acoes}>
          <button type="submit" className={styles.botaoPrincipal} disabled={acao.enviando}>
            {acao.enviando ? 'Salvando…' : sala ? 'Salvar sala' : 'Criar sala'}
          </button>
          {sala && (
            <button type="button" className={styles.botao} onClick={onCancelar}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
