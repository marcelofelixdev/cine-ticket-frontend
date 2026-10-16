import { pdfDoIngresso } from './caixaApi'

/**
 * Abre o PDF do ingresso numa aba nova para imprimir. A aba é aberta antes de buscar o
 * PDF: aberta depois do await, o navegador a bloquearia como pop-up.
 */
export async function imprimirIngresso(ticketId: number): Promise<void> {
  const aba = window.open('', '_blank')
  try {
    const url = URL.createObjectURL(await pdfDoIngresso(ticketId))
    if (aba) {
      aba.location.href = url
    } else {
      baixar(url, `ingresso-${ticketId}.pdf`)
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    aba?.close()
    throw e
  }
}

function baixar(url: string, nome: string): void {
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
}
