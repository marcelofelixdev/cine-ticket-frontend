import { useState, type FormEvent } from 'react'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { CampoDeTexto } from '../comum/CampoDeTexto'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import { Paginacao } from '../comum/Paginacao'
import { useAcao } from '../../lib/useAcao'
import styles from '../Painel.module.css'
import { cinemas, criarCinema, editarCinema, excluirCinema, type Cinema, type DadosDoCinema } from './adminApi'
import { Salas } from './Salas'

const CINEMA_VAZIO: DadosDoCinema = { nome: '', cnpj: '', endereco: '', cidade: '', uf: '' }

/** Cinemas da rede e, abaixo, as salas de todos eles. */
export function CinemasPage() {
  const [pagina, setPagina] = useState(0)
  // Muda quando um cinema é criado, editado ou excluído, para a lista de salas buscar os cinemas de novo.
  const [versao, setVersao] = useState(0)
  const lista = useCarregar((signal) => cinemas(pagina, signal), `${pagina}-${versao}`)
  const [editando, setEditando] = useState<Cinema | null>(null)
  const acao = useAcao()

  function mudou() {
    setVersao((v) => v + 1)
  }

  return (
    <div className={styles.formulario}>
      <div className={styles.colunas}>
        <section className={`${styles.janela} ${styles.colunaLarga}`} aria-labelledby="cinemas">
          <h1 id="cinemas" className={styles.janelaTitulo}>
            Cinemas da rede
          </h1>
          <div className={styles.janelaCorpo}>
            <Avisos sucesso={acao.sucesso} erro={acao.erro} />
            {lista.erro && <p className={styles.alerta}>{lista.erro}</p>}
            {lista.dados?.content.length === 0 && <p>Nenhum cinema cadastrado.</p>}
            {lista.dados && lista.dados.content.length > 0 && (
              <div className={styles.rolagem}>
                <table className={styles.tabela}>
                  <thead>
                    <tr>
                      <th scope="col">Cinema</th>
                      <th scope="col">Cidade</th>
                      <th scope="col">Endereço</th>
                      <th scope="col">CNPJ</th>
                      <th scope="col">
                        <span className="visually-hidden">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.dados.content.map((c) => (
                      <tr key={c.id}>
                        <td>{c.nome}</td>
                        <td>
                          {c.cidade}/{c.uf}
                        </td>
                        <td>{c.endereco}</td>
                        <td>{c.cnpj}</td>
                        <td>
                          <div className={styles.acoes}>
                            <button
                              type="button"
                              className={styles.botao}
                              aria-label={`Editar ${c.nome}`}
                              onClick={() => setEditando(c)}
                            >
                              Editar
                            </button>
                            <ConfirmarEmDoisPassos
                              rotulo="Excluir"
                              confirmar={`Sim, excluir ${c.nome}`}
                              onConfirmar={async () => {
                                const ok = await acao.executar(async () => {
                                  await excluirCinema(c.id)
                                  return `${c.nome} excluído.`
                                })
                                if (ok) {
                                  setEditando(null)
                                  mudou()
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
            <Paginacao info={lista.dados?.page} itens="cinemas" onMudar={setPagina} />
          </div>
        </section>
        <FormularioDeCinema
          key={editando?.id ?? 'novo'}
          cinema={editando}
          onSalvo={(salvo) => {
            // Editando, continua no mesmo cinema (com o aviso de salvo); criando, o formulário volta vazio.
            setEditando((atual) => (atual ? salvo : null))
            mudou()
          }}
          onCancelar={() => setEditando(null)}
        />
      </div>
      <Salas versaoDosCinemas={versao} />
    </div>
  )
}

interface FormularioProps {
  /** Nulo: cadastro de um cinema novo. */
  cinema: Cinema | null
  onSalvo: (salvo: Cinema) => void
  onCancelar: () => void
}

function FormularioDeCinema({ cinema, onSalvo, onCancelar }: FormularioProps) {
  const [dados, setDados] = useState<DadosDoCinema>(cinema ?? CINEMA_VAZIO)
  const acao = useAcao()

  function campo(nome: keyof DadosDoCinema) {
    return { valor: dados[nome], onMudar: (valor: string) => setDados({ ...dados, [nome]: valor }), erro: acao.erros[nome] }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const limpos: DadosDoCinema = {
      nome: dados.nome.trim(),
      cnpj: dados.cnpj.trim(),
      endereco: dados.endereco.trim(),
      cidade: dados.cidade.trim(),
      uf: dados.uf.trim(),
    }
    await acao.executar(async () => {
      const salvo = cinema ? await editarCinema(cinema.id, limpos) : await criarCinema(limpos)
      if (!cinema) {
        setDados(CINEMA_VAZIO)
      }
      onSalvo(salvo)
      return `${salvo.nome} salvo.`
    })
  }

  return (
    <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="form-cinema">
      <h2 id="form-cinema" className={styles.janelaTitulo}>
        {cinema ? `Editar ${cinema.nome}` : 'Novo cinema'}
      </h2>
      <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={salvar} noValidate>
        <Avisos sucesso={acao.sucesso} erro={acao.erro} />
        <CampoDeTexto rotulo="Nome" {...campo('nome')} />
        <CampoDeTexto rotulo="CNPJ" {...campo('cnpj')} />
        <CampoDeTexto rotulo="Endereço" {...campo('endereco')} />
        <div className={styles.duasColunas}>
          <CampoDeTexto rotulo="Cidade" {...campo('cidade')} />
          <CampoDeTexto rotulo="UF" {...campo('uf')} />
        </div>
        <div className={styles.acoes}>
          <button type="submit" className={styles.botaoPrincipal} disabled={acao.enviando}>
            {acao.enviando ? 'Salvando…' : cinema ? 'Salvar cinema' : 'Criar cinema'}
          </button>
          {cinema && (
            <button type="button" className={styles.botao} onClick={onCancelar}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
