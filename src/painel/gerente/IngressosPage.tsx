import { moeda } from '../../lib/formato'
import { ConfirmarEmDoisPassos } from '../comum/ConfirmarEmDoisPassos'
import { Avisos } from '../comum/Avisos'
import { ListaDeIngressos } from '../comum/ListaDeIngressos'
import { listarIngressos } from '../comum/painelApi'
import { useAcao } from '../../lib/useAcao'
import { useCinemaEscolhido } from '../escopo'
import styles from '../Painel.module.css'
import { cancelarVenda } from './gerenteApi'

/** Ingressos do cinema com filtros; venda de balcão pode ser cancelada com devolução no caixa. */
export function IngressosPage() {
  const cinemaId = useCinemaEscolhido()
  const acao = useAcao()
  return (
    <ListaDeIngressos
      titulo="Ingressos do cinema"
      buscar={(filtro, pagina, signal) =>
        listarIngressos('/manager/tickets', { ...filtro, cinemaId: cinemaId?.toString() }, pagina, signal)
      }
      acao={(i, recarregar) =>
        i.canal === 'BALCAO' &&
        i.status === 'APPROVED' &&
        !i.utilizadoEm && (
          <ConfirmarEmDoisPassos
            rotulo="Cancelar venda"
            confirmar="Sim, cancelar e devolver"
            onConfirmar={async () => {
              const ok = await acao.executar(async () => {
                await cancelarVenda(i.id, cinemaId)
                return `Venda #${i.id} cancelada. Devolva ${moeda(i.valorPago)} ao cliente.`
              })
              if (ok) {
                recarregar()
              }
            }}
          />
        )
      }
      rodape={
        <p className={styles.dica}>
          Só vendas de balcão podem ser canceladas aqui, antes do início da sessão. Compras online o cliente cancela pelo
          site.
        </p>
      }
    >
      <Avisos sucesso={acao.sucesso} erro={acao.erro} />
    </ListaDeIngressos>
  )
}
