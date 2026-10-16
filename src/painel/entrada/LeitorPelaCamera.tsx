import { useEffect, useRef, useState } from 'react'
import type QrScanner from 'qr-scanner'
import styles from '../Painel.module.css'
import entrada from './Entrada.module.css'

interface Props {
  /** Valida o código lido; enquanto não termina, novas leituras são ignoradas. */
  onLer: (codigo: string) => Promise<void>
}

/** O mesmo QR na frente da câmera só é enviado de novo depois deste tempo. */
const REPETIR_DEPOIS_MS = 3000

/**
 * Câmera do celular ou do computador como leitor de QR. A biblioteca usa o leitor
 * nativo do navegador (BarcodeDetector) quando existe e decodifica num worker quando não.
 * Ela só é baixada quando a câmera é aberta.
 */
export function LeitorPelaCamera({ onLer }: Props) {
  const [aberta, setAberta] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const onLerAtual = useRef(onLer)

  useEffect(() => {
    onLerAtual.current = onLer
  })

  useEffect(() => {
    const elemento = video.current
    if (!aberta || !elemento) {
      return
    }
    let leitor: QrScanner | null = null
    let cancelado = false
    let ocupado = false
    let ultimo = { codigo: '', quando: 0 }

    function lido(codigo: string) {
      if (ocupado || (codigo === ultimo.codigo && Date.now() - ultimo.quando < REPETIR_DEPOIS_MS)) {
        return
      }
      ocupado = true
      void onLerAtual.current(codigo).finally(() => {
        ocupado = false
        ultimo = { codigo, quando: Date.now() }
      })
    }

    async function abrir(alvo: HTMLVideoElement) {
      try {
        const { default: Leitor } = await import('qr-scanner')
        if (cancelado) {
          return
        }
        leitor = new Leitor(alvo, (resultado) => lido(resultado.data), {
          returnDetailedScanResult: true,
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        })
        await leitor.start()
      } catch (e) {
        if (!cancelado) {
          setErro(mensagemDaCamera(e))
          setAberta(false)
        }
      }
    }

    void abrir(elemento)
    return () => {
      cancelado = true
      leitor?.destroy()
    }
  }, [aberta])

  return (
    <div className={entrada.camera}>
      <div className={styles.acoes}>
        <button
          type="button"
          className={styles.botao}
          aria-pressed={aberta}
          onClick={() => {
            setErro(null)
            setAberta(!aberta)
          }}
        >
          {aberta ? 'Fechar câmera' : 'Ler pela câmera'}
        </button>
      </div>
      {erro && (
        <p className={styles.alerta} role="alert">
          {erro}
        </p>
      )}
      {aberta && (
        <div className={entrada.video}>
          <video ref={video} muted playsInline aria-label="Imagem da câmera" />
        </div>
      )}
    </div>
  )
}

function mensagemDaCamera(e: unknown): string {
  if (e instanceof DOMException && e.name === 'NotAllowedError') {
    return 'O navegador bloqueou a câmera. Libere o acesso nas permissões do site e tente de novo.'
  }
  return 'Não foi possível abrir a câmera. Ela só funciona em páginas HTTPS (ou localhost) e em aparelhos com câmera.'
}
