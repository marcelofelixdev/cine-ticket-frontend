import { montarFileiras, rotulo, type Assento } from '../../lib/assentos'
import caixa from './Caixa.module.css'

interface Props {
  assentos: Assento[]
  corredores: number[]
  selecionados: Set<number>
  bloqueado: boolean
  onAlternar: (assento: Assento) => void
}

export function MapaDeAssentos({ assentos, corredores, selecionados, bloqueado, onAlternar }: Props) {
  return (
    <div>
      <div className={caixa.tela}>TELA</div>
      <div className={caixa.mapa} role="group" aria-label="Mapa de assentos">
        {montarFileiras(assentos, corredores).map((fileira) => (
          <div key={fileira.fila} className={caixa.fileira}>
            <span className={caixa.letra} aria-hidden="true">
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
                  className={assento.corredorAntes ? `${caixa.assento} ${caixa.corredor}` : caixa.assento}
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
      <div className={caixa.legenda} aria-hidden="true">
        <span>□ Livre</span>
        <span>■ Selecionado</span>
        <span>▨ Ocupado</span>
      </div>
    </div>
  )
}
