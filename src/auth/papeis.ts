/** Papéis que entram no painel, do maior para o menor. */
export type PapelPainel = 'ADMIN' | 'MANAGER' | 'STAFF'

const ORDEM: PapelPainel[] = ['ADMIN', 'MANAGER', 'STAFF']

export const NOME_DO_PAPEL: Record<PapelPainel, string> = {
  ADMIN: 'Admin da rede',
  MANAGER: 'Gerente',
  STAFF: 'Funcionário',
}

/** O papel de maior acesso entre os do usuário, ou null se ele não entra no painel (cliente). */
export function papelDoPainel(roles: string[]): PapelPainel | null {
  return ORDEM.find((papel) => roles.includes(`ROLE_${papel}`)) ?? null
}

export interface ItemDoMenu {
  secao: string
  rotulo: string
}

const MENU: Record<PapelPainel, ItemDoMenu[]> = {
  STAFF: [
    { secao: 'caixa', rotulo: 'Caixa' },
    { secao: 'devolucoes', rotulo: 'Devoluções' },
    { secao: 'entrada', rotulo: 'Entrada (validar QR)' },
  ],
  MANAGER: [
    { secao: 'caixa', rotulo: 'Caixa' },
    { secao: 'sessoes', rotulo: 'Sessões' },
    { secao: 'programacao', rotulo: 'Programação' },
    { secao: 'pedidos', rotulo: 'Pedidos de filme' },
    { secao: 'ingressos', rotulo: 'Ingressos' },
    { secao: 'equipe', rotulo: 'Equipe' },
  ],
  ADMIN: [
    { secao: 'pedidos', rotulo: 'Pedidos de filme' },
    { secao: 'filmes', rotulo: 'Filmes' },
    { secao: 'cinemas', rotulo: 'Cinemas e salas' },
    { secao: 'equipe', rotulo: 'Equipe' },
    { secao: 'ingressos', rotulo: 'Ingressos da rede' },
  ],
}

export function menuDoPainel(papel: PapelPainel): ItemDoMenu[] {
  return MENU[papel]
}
