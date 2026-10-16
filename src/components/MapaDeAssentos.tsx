import { montarFileiras, rotulo, type Assento } from '../lib/assentos'

/**
 * CSS module de quem usa o mapa (caixa ou site), com as classes tela, mapa, fileira,
 * letra, assento, corredor e legenda.
 */
export type EstilosDoMapa = Readonly<Record<string, string>>

interface Props {
  assentos: Assento[]
  corredores: number[]
  selecionados: Set<number>
  bloqueado: boolean
  onAlternar: (assento: Assento) => void
  estilos: EstilosDoMapa
}

/** Mapa da sala com os corredores que a API informa; lugares ocupados não são clicáveis. */
export function MapaDeAssentos({ assentos, corredores, selecionados, bloqueado, onAlternar, estilos }: Props) {
  return (
    <div>
      <div className={estilos.tela}>TELA</div>
      <div className={estilos.mapa} role="group" aria-label="Mapa de assentos">
        {montarFileiras(assentos, corredores).map((fileira) => (
          <div key={fileira.fila} className={estilos.fileira}>
            <span className={estilos.letra} aria-hidden="true">
              {fileira.fila}
            </span>
            {fileira.assentos.map((assento) => {
              const ocupado = assento.status === 'OCUPADO'
              const marcado = selecionados.has(assento.id)
              const situacao = ocupado ? 'ocupado' : marcado ? 'selecionado' : 'livre'
              return (
                <button
                  key={assento.id}
                  type="button"
                  className={assento.corredorAntes ? `${estilos.assento} ${estilos.corredor}` : estilos.assento}
                  aria-pressed={marcado}
                  aria-label={`${rotulo(assento)}, ${situacao}`}
                  disabled={ocupado || bloqueado}
                  onClick={() => onAlternar(assento)}
                >
                  {assento.numero}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <div className={estilos.legenda} aria-hidden="true">
        <span>□ Livre</span>
        <span>■ Selecionado</span>
        <span>▨ Ocupado</span>
      </div>
    </div>
  )
}
