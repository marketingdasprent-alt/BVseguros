import type { ReactNode } from 'react'

export interface OpcaoSegmented<T extends string> {
  valor: T
  rotulo: ReactNode
}

interface SegmentedProps<T extends string> {
  opcoes: readonly OpcaoSegmented<T>[]
  valor: T
  onChange: (valor: T) => void
  /** Nome do grupo para leitores de ecrã; ou `rotuloId` se já houver um título visível. */
  rotulo?: string
  rotuloId?: string
  disabled?: boolean
  className?: string
}

/** Escolha de uma opção entre poucas (filtros, modos). Para ações soltas usar Button. */
export function Segmented<T extends string>({ opcoes, valor, onChange, rotulo, rotuloId, disabled, className = '' }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={rotulo} aria-labelledby={rotuloId} className={`segmented ${className}`.trim()}>
      {opcoes.map((o) => (
        <button key={o.valor} type="button" aria-pressed={valor === o.valor} disabled={disabled} onClick={() => onChange(o.valor)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}
