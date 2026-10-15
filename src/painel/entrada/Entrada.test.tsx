import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chamadas, fakeApi, json, ultimoCorpo } from '../../test/fakeApi'
import { EntradaPage } from './EntradaPage'

/** qr-scanner falso: guarda a função de leitura para o teste "mostrar" um QR à câmera. */
const camera = vi.hoisted(() => ({
  ler: null as ((resultado: { data: string }) => void) | null,
  falhar: null as unknown,
  destruida: false,
}))

vi.mock('qr-scanner', () => ({
  default: class {
    constructor(_video: HTMLVideoElement, ler: (resultado: { data: string }) => void) {
      camera.ler = ler
      camera.destruida = false
    }
    start() {
      return camera.falhar ? Promise.reject(camera.falhar) : Promise.resolve()
    }
    destroy() {
      camera.destruida = true
    }
  },
}))

afterEach(() => {
  vi.unstubAllGlobals()
  camera.ler = null
  camera.falhar = null
})

const liberada = {
  ticketId: 901,
  filmeTitulo: 'Batman: O Cavaleiro das Trevas',
  cinemaNome: 'Cine Paulista',
  salaNome: 'Sala 3',
  cadeiraAssento: 'A-3',
  horarioSessao: '2026-10-15T21:40:00',
  ticketType: 'INTEIRA',
  alerta: null,
  utilizadoEm: '2026-10-15T21:31:00',
}

describe('entrada', () => {
  it('libera o ingresso, mostra o que conferir e limpa o campo para a próxima leitura', async () => {
    const api = fakeApi({
      'POST /tickets/validate': () =>
        json({
          ticketId: 901,
          filmeTitulo: 'Batman: O Cavaleiro das Trevas',
          cinemaNome: 'Cine Paulista',
          salaNome: 'Sala 3',
          cadeiraAssento: 'A-3',
          horarioSessao: '2026-10-15T21:40:00',
          ticketType: 'MEIA_ESTUDANTE',
          alerta: 'Confira a carteira de estudante 123456789.',
          utilizadoEm: '2026-10-15T21:31:00',
        }),
    })
    render(<EntradaPage />)

    const campo = screen.getByLabelText('Código do QR')
    await userEvent.type(campo, 'CT1.901.abc{Enter}')

    expect(await screen.findByText('Entrada liberada')).toBeInTheDocument()
    expect(screen.getByText('Confira a carteira de estudante 123456789.')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /tickets/validate')).toEqual({ qr: 'CT1.901.abc' })
    expect(campo).toHaveValue('')
    expect(campo).toHaveFocus()
  })

  it('ingresso já usado mostra a recusa com a explicação da API', async () => {
    fakeApi({
      'POST /tickets/validate': () => json({ title: 'Conflito', detail: 'Este ingresso já foi utilizado às 21:31.' }, 409),
    })
    render(<EntradaPage />)

    await userEvent.type(screen.getByLabelText('Código do QR'), 'CT1.901.abc{Enter}')

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Entrada recusada')
    expect(alerta).toHaveTextContent('Este ingresso já foi utilizado às 21:31.')
    expect(screen.getByText(/Recusada: Entrada recusada/)).toBeInTheDocument()
  })

  it('lê o QR pela câmera, ignora o mesmo QR logo em seguida e fecha a câmera', async () => {
    const api = fakeApi({ 'POST /tickets/validate': () => json(liberada) })
    render(<EntradaPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Ler pela câmera' }))
    await vi.waitFor(() => expect(camera.ler).not.toBeNull())

    act(() => camera.ler?.({ data: 'CT1.901.abc' }))
    expect(await screen.findByText('Entrada liberada')).toBeInTheDocument()
    expect(ultimoCorpo(api, 'POST /tickets/validate')).toEqual({ qr: 'CT1.901.abc' })

    // A câmera continua vendo o mesmo QR: não manda de novo.
    act(() => camera.ler?.({ data: 'CT1.901.abc' }))
    expect(chamadas(api, 'POST /tickets/validate')).toBe(1)

    await userEvent.click(screen.getByRole('button', { name: 'Fechar câmera' }))
    expect(camera.destruida).toBe(true)
  })

  it('explica quando o navegador bloqueia a câmera', async () => {
    camera.falhar = new DOMException('Permission denied', 'NotAllowedError')
    render(<EntradaPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Ler pela câmera' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('O navegador bloqueou a câmera')
    expect(screen.getByRole('button', { name: 'Ler pela câmera' })).toBeInTheDocument()
  })
})
