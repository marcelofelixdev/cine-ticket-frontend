import { describe, expect, it } from 'vitest'
import { montarFileiras, rotulo, type Assento } from './assentos'

const a = (id: number, fila: string, numero: number): Assento => ({ id, fila, numero, status: 'LIVRE' })

describe('montarFileiras', () => {
  it('agrupa por fila em ordem e marca os corredores', () => {
    const fileiras = montarFileiras([a(5, 'B', 2), a(1, 'A', 3), a(2, 'A', 1), a(3, 'A', 2), a(4, 'B', 1)], [2])

    expect(fileiras.map((f) => f.fila)).toEqual(['A', 'B'])
    expect(fileiras[0].assentos.map((s) => [s.numero, s.corredorAntes])).toEqual([
      [1, false],
      [2, false],
      [3, true],
    ])
  })

  it('sem corredores, nenhum vão', () => {
    const [fileira] = montarFileiras([a(1, 'A', 1), a(2, 'A', 2)], [])
    expect(fileira.assentos.every((s) => !s.corredorAntes)).toBe(true)
  })
})

it('rótulo igual ao do backend', () => {
  expect(rotulo({ fila: 'D', numero: 5 })).toBe('D-5')
})
