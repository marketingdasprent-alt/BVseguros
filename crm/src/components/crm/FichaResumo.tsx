import { AlertTriangle, CalendarClock, Euro, Shield } from 'lucide-react'
import { formatarData, formatarMoeda } from '@/lib/format'
import type { ResumoCliente } from '@/lib/fichaCliente'

export function FichaResumo({ resumo }: { resumo: ResumoCliente }) {
  const proxima = resumo.proximaRenovacao
  return (
    <section className="metrics-strip" aria-label="Resumo do cliente">
      <div className="metric">
        <span className="metric-label">Apólices ativas <Shield size={17} aria-hidden="true" /></span>
        <strong className="metric-value">{resumo.apolicesAtivas}</strong>
      </div>
      <div className="metric">
        <span className="metric-label">Prémio anual <Euro size={17} aria-hidden="true" /></span>
        <strong className="metric-value metric-value--longo">{formatarMoeda(resumo.premioAnualTotal)}</strong>
        <span className="metric-note">Soma das apólices ativas</span>
      </div>
      <div className="metric">
        <span className="metric-label">Sinistros em aberto <AlertTriangle size={17} aria-hidden="true" /></span>
        <strong className="metric-value">{resumo.sinistrosEmAberto}</strong>
      </div>
      <div className="metric">
        <span className="metric-label">Próxima renovação <CalendarClock size={17} aria-hidden="true" /></span>
        <strong className="metric-value metric-value--longo">{proxima ? formatarData(proxima.data_fim as string) : '—'}</strong>
        {proxima && <span className="metric-note">Apólice {proxima.numero_apolice}</span>}
      </div>
    </section>
  )
}
