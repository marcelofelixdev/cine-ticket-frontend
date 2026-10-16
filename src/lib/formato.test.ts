import { describe, expect, it } from 'vitest'
import { diaMes, hora, precoDoTipo, somarDias, versao } from './formato'

describe('formato', () => {
  it('usa os preços que a API manda na sessão', () => {
    const sessao = { valorBase: 30.05, valorMeia: 15.03 }
    expect(precoDoTipo(sessao, 'MEIA_ESTUDANTE')).toBe(15.03)
    expect(precoDoTipo(sessao, 'MEIA_IDOSO')).toBe(15.03)
    expect(precoDoTipo(sessao, 'INTEIRA')).toBe(30.05)
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
