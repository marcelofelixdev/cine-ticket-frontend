import { describe, expect, it } from 'vitest'
import { menuDoPainel, papelDoPainel } from './papeis'

describe('papelDoPainel', () => {
  it('escolhe o papel de maior acesso', () => {
    expect(papelDoPainel(['ROLE_USER', 'ROLE_STAFF', 'ROLE_MANAGER'])).toBe('MANAGER')
    expect(papelDoPainel(['ROLE_ADMIN', 'ROLE_USER'])).toBe('ADMIN')
  })

  it('cliente não entra no painel', () => {
    expect(papelDoPainel(['ROLE_USER'])).toBeNull()
  })
})

describe('menuDoPainel', () => {
  const secoes = (papel: Parameters<typeof menuDoPainel>[0]) => menuDoPainel(papel).map((i) => i.secao)

  it('funcionário fica no caixa, nas devoluções e na entrada', () => {
    expect(secoes('STAFF')).toEqual(['caixa', 'devolucoes', 'entrada'])
  })

  it('gerente cuida do próprio cinema e também vende no caixa', () => {
    expect(secoes('MANAGER')).toEqual(['caixa', 'devolucoes', 'sessoes', 'programacao', 'pedidos', 'ingressos', 'equipe'])
  })

  it('admin cuida da rede e não usa o caixa', () => {
    expect(secoes('ADMIN')).not.toContain('caixa')
  })
})
