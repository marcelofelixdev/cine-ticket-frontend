import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { mapaDaSala, type MapaDaSala } from '../../api/sessoes'
import { useAuth } from '../../auth/AuthContext'
import { MapaDeAssentos } from '../../components/MapaDeAssentos'
import { rotulo, type Assento } from '../../lib/assentos'
import { dataCompleta, diaDaSemana, hoje, hora, moeda, nomeDoAudio, NOME_DO_TIPO, precoDoTipo } from '../../lib/formato'
import type { TipoIngresso } from '../../lib/tipos'
import { useCarregar } from '../../lib/useCarregar'
import { sessao as buscarSessao, type SessaoPublica } from '../siteApi'
import siteStyles from '../Site.module.css'
import styles from './Compra.module.css'
import { EtapasDaCompra } from './EtapasDaCompra'
import { guardarEscolha, lerEscolha, type LugarEscolhido } from './escolha'

const TIPOS: TipoIngresso[] = ['INTEIRA', 'MEIA_ESTUDANTE', 'MEIA_IDOSO']

/** Escolha dos lugares e do tipo de cada ingresso; a reserva acontece no pagamento. */
export function AssentosPage() {
  const id = Number(useParams().id)
  const sessao = useCarregar((signal) => buscarSessao(id, signal), String(id))
  const mapa = useCarregar((signal) => mapaDaSala(id, signal), String(id))

  if (sessao.erro || mapa.erro) {
    return (
      <main className={siteStyles.pagina}>
        <h1 className={siteStyles.titulo}>Sessão indisponível</h1>
        <p>{sessao.erro ?? mapa.erro}</p>
        <Link to="/">Voltar para a programação</Link>
      </main>
    )
  }
  if (!sessao.dados || !mapa.dados) {
    return (
      <main className={siteStyles.pagina}>
        <p role="status">Carregando a sala…</p>
      </main>
    )
  }
  return <Escolha sessao={sessao.dados} mapa={mapa.dados} />
}

function Escolha({ sessao, mapa }: { sessao: SessaoPublica; mapa: MapaDaSala }) {
  const { sessao: login } = useAuth()
  const navigate = useNavigate()
  const livres = new Set(mapa.assentos.filter((a) => a.status === 'LIVRE').map((a) => a.id))
  // Volta do login com a escolha guardada; lugares que deixaram de estar livres saem.
  const [lugares, setLugares] = useState<LugarEscolhido[]>(() =>
    lerEscolha(sessao.id)
      .filter((l) => livres.has(l.seatId))
      .slice(0, mapa.maxLugaresPorPedido),
  )
  const selecionados = new Set(lugares.map((l) => l.seatId))
  const limite = mapa.maxLugaresPorPedido
  const noLimite = lugares.length >= limite
  const total = lugares.reduce((soma, l) => soma + precoDoTipo(sessao, l.tipo), 0)

  const [avisoDeLimite, setAvisoDeLimite] = useState(false)

  function alternar(assento: Assento) {
    if (selecionados.has(assento.id)) {
      setAvisoDeLimite(false)
      setLugares((atuais) => atuais.filter((l) => l.seatId !== assento.id))
      return
    }
    if (noLimite) {
      setAvisoDeLimite(true)
      return
    }
    setLugares((atuais) => [...atuais, { seatId: assento.id, rotulo: rotulo(assento), tipo: 'INTEIRA' }])
  }

  function mudar(seatId: number, mudanca: Partial<LugarEscolhido>) {
    setLugares((atuais) => atuais.map((l) => (l.seatId === seatId ? { ...l, ...mudanca } : l)))
  }

  function continuar() {
    guardarEscolha({ sessionId: sessao.id, lugares })
    const pagamento = `/sessoes/${sessao.id}/pagamento`
    if (login.status === 'logado') {
      navigate(pagamento)
    } else {
      navigate('/entrar', { state: { de: pagamento } })
    }
  }

  const data = sessao.horarioInicio.slice(0, 10)
  const quando = data === hoje() ? 'Hoje' : `${diaDaSemana(data)}/${dataCompleta(data).slice(3, 5)}`

  return (
    <main className={`${siteStyles.pagina} ${styles.compra}`}>
      <section className={styles.sala} aria-labelledby="titulo-sessao">
        <EtapasDaCompra atual={0} />
        <Link to={`/filmes/${sessao.movieId}`} className={styles.voltar}>
          Voltar para o filme
        </Link>
        <h1 id="titulo-sessao" className={siteStyles.titulo}>
          {sessao.movieTitulo}
        </h1>
        <p className={styles.detalhes}>
          <span>
            {quando}, {hora(sessao.horarioInicio)} · {sessao.cinemaNome}, {sessao.roomNome}
          </span>
          <span className={styles.selo}>{sessao.formato}</span>
          <span className={styles.selo}>{nomeDoAudio(sessao.audio)}</span>
          <span>
            {mapa.assentosLivres} de {mapa.totalAssentos} lugares livres
          </span>
        </p>
        <MapaDeAssentos
          assentos={mapa.assentos}
          corredores={mapa.corredores}
          selecionados={selecionados}
          bloqueado={false}
          onAlternar={alternar}
          estilos={styles}
        />
      </section>

      <aside className={styles.pedido} aria-labelledby="seu-pedido">
        <h2 id="seu-pedido" className={styles.subtitulo}>
          Seu pedido
        </h2>
        <p className={styles.contagem} aria-live="polite">
          {lugares.length} de até {limite} lugares por compra
        </p>
        {avisoDeLimite && (
          <p className={styles.limite} role="alert">
            Você já escolheu {limite} lugares, o máximo por compra. Desmarque um para trocar de lugar.
          </p>
        )}
        {lugares.length === 0 && <p>Escolha seus lugares no mapa.</p>}
        {lugares.map((l) => (
          <fieldset key={l.seatId} className={styles.lugar}>
            <legend>{l.rotulo}</legend>
            <label className={styles.campo}>
              Tipo de ingresso
              <select value={l.tipo} onChange={(e) => mudar(l.seatId, { tipo: e.target.value as TipoIngresso })}>
                {TIPOS.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {NOME_DO_TIPO[tipo]}, {moeda(precoDoTipo(sessao, tipo))}
                  </option>
                ))}
              </select>
            </label>
            {l.tipo === 'MEIA_ESTUDANTE' && (
              <>
                <label className={styles.campo}>
                  Nº da carteira de estudante
                  <input
                    value={l.documentoMeia ?? ''}
                    onChange={(e) => mudar(l.seatId, { documentoMeia: e.target.value })}
                    autoComplete="off"
                  />
                </label>
                <span className={styles.dica}>A carteira é conferida na entrada, junto com o ingresso.</span>
              </>
            )}
            {l.tipo === 'MEIA_IDOSO' && (
              <span className={styles.dica}>Usa a data de nascimento do seu perfil; o documento é conferido na entrada.</span>
            )}
          </fieldset>
        ))}
        <p className={styles.meias}>
          <strong>Meias nesta sessão:</strong> restam {mapa.meiasRestantes}.
        </p>
        <div className={styles.total}>
          <span>Total</span>
          <strong>{moeda(total)}</strong>
        </div>
        <button type="button" className={styles.continuar} disabled={lugares.length === 0} onClick={continuar}>
          Continuar para o pagamento
        </button>
        <p className={styles.dica}>
          Os lugares ficam guardados por alguns minutos enquanto você paga. Se o pagamento não terminar, eles voltam a
          ficar livres.
        </p>
      </aside>
    </main>
  )
}
