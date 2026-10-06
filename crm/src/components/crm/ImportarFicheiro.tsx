import { useState, type DragEvent } from 'react'
import { Download, FileSpreadsheet, FileUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ACEITES } from '@/lib/ficheiroImportacao'

interface ImportarFicheiroProps {
  rotuloTipo: string
  ficheiro: File | null
  aLer: boolean
  disabled?: boolean
  onFicheiro: (f: File) => void
  onDescarregarModelo: () => void
}

/** Passo 2: escolher (ou largar) o ficheiro, com o modelo em Excel ao lado. */
export function ImportarFicheiro({ rotuloTipo, ficheiro, aLer, disabled, onFicheiro, onDescarregarModelo }: ImportarFicheiroProps) {
  const [aArrastar, setAArrastar] = useState(false)
  const bloqueado = disabled || aLer

  const largar = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setAArrastar(false)
    const f = e.dataTransfer.files?.[0]
    if (f && !bloqueado) onFicheiro(f)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="import-step-title"><span className="import-step-number">2</span>Escolha o ficheiro de {rotuloTipo}</h2>
        <Button variant="secondary" icon={<Download />} onClick={onDescarregarModelo} disabled={disabled}>Descarregar modelo (Excel)</Button>
      </div>

      <input id="ficheiro-carteira" type="file" accept={ACEITES} className="sr-only" disabled={bloqueado}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFicheiro(f); e.target.value = '' }} />
      <label htmlFor="ficheiro-carteira" aria-disabled={bloqueado || undefined}
        className={`dropzone${aArrastar ? ' is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!bloqueado) setAArrastar(true) }}
        onDragLeave={() => setAArrastar(false)}
        onDrop={largar}>
        {aLer ? <Loader2 size={28} className="motion-safe:animate-spin" aria-hidden="true" /> : ficheiro ? <FileSpreadsheet size={28} aria-hidden="true" /> : <FileUp size={28} aria-hidden="true" />}
        <strong>{aLer ? 'A ler o ficheiro…' : ficheiro ? ficheiro.name : 'Arraste o ficheiro para aqui ou clique para escolher'}</strong>
        <small>{ficheiro && !aLer ? 'Clique para escolher outro ficheiro.' : 'Excel (.xlsx), CSV ou PDF gerado a partir do modelo.'}</small>
      </label>
    </div>
  )
}
