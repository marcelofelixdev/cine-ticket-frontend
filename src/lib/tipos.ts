/** Tipos que espelham os enums da API. */
export type TipoIngresso = 'INTEIRA' | 'MEIA_ESTUDANTE' | 'MEIA_IDOSO'
export type FormaPagamento = 'DINHEIRO' | 'CREDITO' | 'DEBITO' | 'PIX'
export type Audio = 'DUBLADO' | 'LEGENDADO' | 'NACIONAL'
export type Formato = '2D' | '3D'
export type StatusIngresso = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'EMERGENCY_CANCELLED' | 'EXPIRED'
export type CanalVenda = 'ONLINE' | 'BALCAO'
export const AUDIOS: Audio[] = ['DUBLADO', 'LEGENDADO', 'NACIONAL']
export const FORMATOS: Formato[] = ['2D', '3D']
