import type { Cliente } from '@/lib/types'

interface ClientesTableProps {
  clientes: Cliente[]
  nomePorId: Map<string, string>
  podeAtribuir: boolean
  onAtribuir: (cliente: Cliente) => void
  onAssumir: (cliente: Cliente) => void
}

export function ClientesTable({ clientes, nomePorId, podeAtribuir, onAtribuir, onAssumir }: ClientesTableProps) {
  return (
    <div className="table-panel">
      <div className="data-panel-heading">Carteira de clientes<span>{clientes.length} {clientes.length === 1 ? 'registo' : 'registos'}</span></div>
      <div role="region" aria-label="Lista de clientes" tabIndex={0} className="overflow-x-auto scroll-thin">
        <table className="crm-table w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="sticky left-0 z-10 font-semibold uppercase whitespace-nowrap">
                Nome
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Telefone
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Email
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                NIF
              </th>
              <th className="font-semibold uppercase whitespace-nowrap">
                Responsável
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-ink/[0.02] transition-colors">
                <td className="sticky left-0 z-10 bg-white whitespace-nowrap">
                  {c.nome}
                </td>
                <td className="whitespace-nowrap">{c.telefone}</td>
                <td className="whitespace-nowrap">{c.email ?? '—'}</td>
                <td className="whitespace-nowrap">{c.nif ?? '—'}</td>
                <td className="whitespace-nowrap">
                  <span className={c.responsavel_id ? '' : 'text-muted'}>
                    {c.responsavel_id ? nomePorId.get(c.responsavel_id) ?? 'Atribuído' : 'Sem responsável'}
                  </span>
                  {(podeAtribuir || !c.responsavel_id) && (
                    <button type="button" onClick={() => (podeAtribuir ? onAtribuir(c) : onAssumir(c))}
                      className="ml-3 text-xs font-medium text-navy underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded">
                      {podeAtribuir ? 'Atribuir' : 'Assumir'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
