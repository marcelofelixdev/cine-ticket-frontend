import { useState } from 'react'
import styles from '../Painel.module.css'

interface Props {
  /** Texto do primeiro botão ("Cancelar sessão"). */
  rotulo: string
  /** Texto do botão que confirma ("Sim, cancelar"). */
  confirmar: string
  onConfirmar: () => Promise<void>
}

/** Ação que não dá para desfazer: um clique abre a confirmação, o segundo executa. */
export function ConfirmarEmDoisPassos({ rotulo, confirmar, onConfirmar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function executar() {
    setEnviando(true)
    try {
      await onConfirmar()
      setAberto(false)
    } finally {
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <button type="button" className={styles.botao} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
    )
  }
  return (
    <span className={styles.confirmacao}>
      <button type="button" className={styles.botaoPerigo} disabled={enviando} onClick={() => void executar()}>
        {enviando ? 'Aguarde…' : confirmar}
      </button>
      <button type="button" className={styles.botao} onClick={() => setAberto(false)}>
        Voltar
      </button>
    </span>
  )
}
