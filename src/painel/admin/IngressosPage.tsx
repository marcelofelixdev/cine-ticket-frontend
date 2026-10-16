import { useState } from 'react'
import { useCarregar } from '../../lib/useCarregar'
import { JanelaDeResumo } from '../comum/JanelaDeResumo'
import { ListaDeIngressos } from '../comum/ListaDeIngressos'
import { listarIngressos } from '../comum/painelApi'
import styles from '../Painel.module.css'
import { resumoDaSessaoNaRede, todosOsCinemas } from './adminApi'

/** Ingressos de todos os cinemas, com filtro por cinema e o resumo da sessão de cada ingresso. */
export function IngressosPage() {
  const rede = useCarregar((signal) => todosOsCinemas(signal), 'cinemas')
  const [sessaoId, setSessaoId] = useState<number | null>(null)

  return (
    <div className={styles.formulario}>
      <ListaDeIngressos
        titulo="Ingressos da rede"
        buscar={(filtro, pagina, signal) => listarIngressos('/admin/tickets', filtro, pagina, signal)}
        cinemas={rede.dados?.content ?? []}
        acao={(i) => (
          <button
            type="button"
            className={styles.botao}
            aria-pressed={sessaoId === i.sessionId}
            aria-label={`Resumo da sessão do ingresso ${i.id}`}
            onClick={() => setSessaoId(sessaoId === i.sessionId ? null : i.sessionId)}
          >
            Sessão
          </button>
        )}
      />
      {sessaoId !== null && <JanelaDeResumo id={sessaoId} buscar={resumoDaSessaoNaRede} />}
    </div>
  )
}
