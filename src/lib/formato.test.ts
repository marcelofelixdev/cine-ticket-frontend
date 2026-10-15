import { describe, expect, it } from 'vitest'
import { diaMes, hora, precoDoTipo, somarDias, versao } from './formato'

describe('formato', () => {
  it('meia é a metade, arredondada no centavo como no backend', () => {
    expect(precoDoTipo(38, 'MEIA_ESTUDANTE')).toBe(19)
    expect(precoDoTipo(30.05, 'MEIA_IDOSO')).toBe(15.03)
    expect(precoDoTipo(42, 'INTEIRA')).toBe(42)
  })

  it('lê a data e hora da API sem mexer no fuso', () => {
    expect(hora('2026-10-15T21:40:00')).toBe('21:40')
    expect(diaMes('2026-10-15T21:40:00')).toBe('15/10')
  })

  it('soma dias atravessando o mês', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(somarDias('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('versão da sessão', () => {
    expect(versao('3D', 'LEGENDADO')).toBe('3D LEG')
  })
})
