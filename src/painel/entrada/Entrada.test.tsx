import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeApi, json, ultimoCorpo } from '../../test/fakeApi'
import { EntradaPage } from './EntradaPage'

afterEach(() => vi.unstubAllGlobals())

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
})
