import { useState, type FormEvent } from 'react'
import { useCarregar } from '../../lib/useCarregar'
import { Avisos } from '../comum/Avisos'
import { CamposDeAcesso, TabelaDeEquipe } from '../comum/Equipe'
import { ACESSO_VAZIO, NOME_DO_PAPEL_DA_EQUIPE, type PapelDaEquipe } from '../comum/painelApi'
import { useAcao } from '../comum/useAcao'
import styles from '../Painel.module.css'
import { cadastrarNaEquipe, equipeDaRede, todosOsCinemas } from './adminApi'

const PAPEIS = Object.keys(NOME_DO_PAPEL_DA_EQUIPE) as PapelDaEquipe[]

/** Gerentes e funcionários de todos os cinemas; o admin cadastra os dois papéis. */
export function EquipePage() {
  const rede = useCarregar((signal) => todosOsCinemas(signal), 'cinemas')
  const [filtro, setFiltro] = useState('')
  const membros = useCarregar((signal) => equipeDaRede(filtro, signal), `equipe-${filtro}`)
  const [dados, setDados] = useState(ACESSO_VAZIO)
  const [papel, setPapel] = useState<PapelDaEquipe>('MANAGER')
  const [cinemaId, setCinemaId] = useState('')
  const acao = useAcao()
  const cinemas = rede.dados?.content ?? []

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await acao.executar(async () => {
      const novo = await cadastrarNaEquipe({
        ...dados,
        nome: dados.nome.trim(),
        email: dados.email.trim(),
        papel,
        cinemaId: cinemaId ? Number(cinemaId) : null,
      })
      return `${novo.nome} cadastrado como ${NOME_DO_PAPEL_DA_EQUIPE[novo.papel].toLowerCase()} do ${novo.cinemaNome}. Passe o e-mail e a senha para ele entrar no painel.`
    })
    if (ok) {
      setDados(ACESSO_VAZIO)
      membros.recarregar()
    }
  }

  return (
    <div className={styles.colunas}>
      <section className={`${styles.janela} ${styles.colunaLarga}`} aria-labelledby="equipe">
        <h1 id="equipe" className={styles.janelaTitulo}>
          Equipe da rede
        </h1>
        <div className={styles.janelaCorpo}>
          <label className={styles.campo} style={{ maxWidth: 260 }}>
            Mostrar o cinema
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todos</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          {membros.erro && <p className={styles.alerta}>{membros.erro}</p>}
          {membros.dados && <TabelaDeEquipe membros={membros.dados} comCinema />}
        </div>
      </section>
      <section className={`${styles.janela} ${styles.colunaEstreita}`} aria-labelledby="novo-membro">
        <h2 id="novo-membro" className={styles.janelaTitulo}>
          Cadastrar na equipe
        </h2>
        <form className={`${styles.janelaCorpo} ${styles.formulario}`} onSubmit={cadastrar} noValidate>
          <Avisos sucesso={acao.sucesso} erro={acao.erro} />
          <div className={styles.duasColunas}>
            <label className={styles.campo}>
              Papel
              <select value={papel} onChange={(e) => setPapel(e.target.value as PapelDaEquipe)}>
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {NOME_DO_PAPEL_DA_EQUIPE[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.campo}>
              Cinema
              <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)}>
                <option value="">Escolha</option>
                {cinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {acao.erros.cinemaId && <span className={styles.erroDoCampo}>{acao.erros.cinemaId}</span>}
            </label>
          </div>
          <CamposDeAcesso dados={dados} onMudar={setDados} erros={acao.erros} />
          <button type="submit" className={styles.botaoPrincipal} disabled={acao.enviando}>
            {acao.enviando ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </form>
      </section>
    </div>
  )
}
