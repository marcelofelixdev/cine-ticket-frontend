import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../../auth/AuthContext'
import { papelDoPainel } from '../../auth/papeis'
import type { Usuario } from '../../auth/types'
import { useAcao } from '../../lib/useAcao'
import { CampoDeTexto } from '../../painel/comum/CampoDeTexto'
import siteStyles from '../Site.module.css'
import styles from './Conta.module.css'

/** Dados do cliente: nome e data de nascimento (usada na meia 60+); e-mail não muda aqui. */
export function MinhaContaPage() {
  const { sessao } = useAuth()
  if (sessao.status === 'carregando') {
    return (
      <main className={siteStyles.pagina}>
        <p role="status">Carregando…</p>
      </main>
    )
  }
  if (sessao.status === 'anonimo') {
    return <Navigate to="/entrar" replace state={{ de: '/minha-conta' }} />
  }
  return <Conta usuario={sessao.usuario} />
}

function Conta({ usuario }: { usuario: Usuario }) {
  const { atualizarPerfil, sair } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState(usuario.nome)
  const [nascimento, setNascimento] = useState(usuario.dataNascimento ?? '')
  const acao = useAcao()
  const equipe = papelDoPainel(usuario.roles) !== null

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await acao.executar(async () => {
      await atualizarPerfil({ nome: nome.trim(), dataNascimento: nascimento || undefined })
      return 'Dados salvos.'
    })
  }

  async function encerrar() {
    await sair()
    navigate('/')
  }

  return (
    <main className={`${siteStyles.pagina} ${styles.pagina}`}>
      <section className={styles.cartao} aria-labelledby="titulo-conta">
        <h1 id="titulo-conta" className={siteStyles.titulo}>
          Minha conta
        </h1>
        <p>{usuario.email}</p>
        <div className={styles.atalhos}>
          <Link to="/meus-ingressos">Meus ingressos</Link>
          {equipe && <Link to="/painel">Abrir o painel da equipe</Link>}
        </div>
        <form className={styles.formulario} onSubmit={salvar} noValidate>
          {acao.sucesso && (
            <p className={styles.sucesso} role="status">
              {acao.sucesso}
            </p>
          )}
          {acao.erro && (
            <p className={styles.alerta} role="alert">
              {acao.erro}
            </p>
          )}
          <CampoDeTexto rotulo="Nome" valor={nome} onMudar={setNome} erro={acao.erros.nome} estilos={styles} />
          <CampoDeTexto
            rotulo="Data de nascimento"
            type="date"
            valor={nascimento}
            onMudar={setNascimento}
            erro={acao.erros.dataNascimento}
            estilos={styles}
          />
          <p className={styles.dica}>Usada só para a meia-entrada de quem tem 60 anos ou mais.</p>
          <button type="submit" className={styles.principal} disabled={acao.enviando}>
            {acao.enviando ? 'Salvando…' : 'Salvar'}
          </button>
        </form>
        <button type="button" className={styles.secundario} onClick={() => void encerrar()}>
          Sair
        </button>
      </section>
    </main>
  )
}
