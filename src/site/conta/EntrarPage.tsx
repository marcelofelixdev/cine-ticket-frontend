import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { useAcao } from '../../lib/useAcao'
import { CampoDeTexto } from '../../painel/comum/CampoDeTexto'
import siteStyles from '../Site.module.css'
import styles from './Conta.module.css'

type Aba = 'entrar' | 'criar'

/** Entrar ou criar conta de cliente; depois volta para onde a pessoa estava (ex.: o pagamento). */
export function EntrarPage() {
  const { sessao } = useAuth()
  const location = useLocation()
  const destino = (location.state as { de?: string } | null)?.de ?? '/'
  const [aba, setAba] = useState<Aba>('entrar')

  if (sessao.status === 'logado') {
    return <Navigate to={destino} replace />
  }

  return (
    <main className={`${siteStyles.pagina} ${styles.pagina}`}>
      <section className={styles.cartao} aria-labelledby="titulo-conta">
        <h1 id="titulo-conta" className={siteStyles.titulo}>
          {aba === 'entrar' ? 'Entrar' : 'Criar conta'}
        </h1>
        {destino !== '/' && <p className={styles.aviso}>Entre ou crie sua conta para continuar a compra.</p>}
        <div className={styles.abas} role="tablist" aria-label="Entrar ou criar conta">
          <button type="button" role="tab" aria-selected={aba === 'entrar'} onClick={() => setAba('entrar')}>
            Já tenho conta
          </button>
          <button type="button" role="tab" aria-selected={aba === 'criar'} onClick={() => setAba('criar')}>
            Criar conta
          </button>
        </div>
        {aba === 'entrar' ? <FormularioDeEntrada destino={destino} /> : <FormularioDeCadastro destino={destino} />}
        <p className={styles.equipe}>
          Trabalha num dos cinemas? <Link to="/painel/login">Entre no painel da equipe</Link>.
        </p>
      </section>
    </main>
  )
}

function FormularioDeEntrada({ destino }: { destino: string }) {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const acao = useAcao()

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (await acao.executar(() => entrar(email.trim(), senha).then(() => undefined))) {
      navigate(destino, { replace: true })
    }
  }

  return (
    <form className={styles.formulario} onSubmit={enviar} noValidate>
      {acao.erro && (
        <p className={styles.alerta} role="alert">
          {acao.erro}
        </p>
      )}
      <CampoDeTexto rotulo="E-mail" type="email" autoComplete="email" valor={email} onMudar={setEmail} estilos={styles} />
      <CampoDeTexto
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        valor={senha}
        onMudar={setSenha}
        estilos={styles}
      />
      <button type="submit" className={styles.principal} disabled={acao.enviando}>
        {acao.enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

function FormularioDeCadastro({ destino }: { destino: string }) {
  const { cadastrar } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nascimento, setNascimento] = useState('')
  const acao = useAcao()

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await acao.executar(() =>
      cadastrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        dataNascimento: nascimento || undefined,
      }).then(() => undefined),
    )
    if (ok) {
      navigate(destino, { replace: true })
    }
  }

  return (
    <form className={styles.formulario} onSubmit={enviar} noValidate>
      {acao.erro && (
        <p className={styles.alerta} role="alert">
          {acao.erro}
        </p>
      )}
      <CampoDeTexto rotulo="Nome" autoComplete="name" valor={nome} onMudar={setNome} erro={acao.erros.nome} estilos={styles} />
      <CampoDeTexto
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        valor={email}
        onMudar={setEmail}
        erro={acao.erros.email}
        estilos={styles}
      />
      <CampoDeTexto
        rotulo="Senha"
        type="password"
        autoComplete="new-password"
        valor={senha}
        onMudar={setSenha}
        erro={acao.erros.senha}
        estilos={styles}
      />
      <CampoDeTexto
        rotulo="Data de nascimento (opcional)"
        type="date"
        valor={nascimento}
        onMudar={setNascimento}
        erro={acao.erros.dataNascimento}
        estilos={styles}
      />
      <p className={styles.dica}>
        A data de nascimento só é usada para a meia-entrada de quem tem 60 anos ou mais. Dá para preencher depois em
        Minha conta.
      </p>
      <button type="submit" className={styles.principal} disabled={acao.enviando}>
        {acao.enviando ? 'Criando…' : 'Criar conta e entrar'}
      </button>
    </form>
  )
}
