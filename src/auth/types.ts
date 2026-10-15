/** Resposta de GET /users/me. */
export interface Usuario {
  id: number
  nome: string
  email: string
  roles: string[]
  dataNascimento: string | null
  /** Cinema do gerente ou funcionário; nulo para clientes e admins. */
  cinemaId: number | null
}
