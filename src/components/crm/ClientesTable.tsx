import type { Cliente } from '@/lib/types'

export function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink/[0.03] text-ink/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">NIF</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id} className="border-t border-ink/5">
              <td className="px-4 py-3">{c.nome}</td>
              <td className="px-4 py-3">{c.telefone}</td>
              <td className="px-4 py-3">{c.email ?? '—'}</td>
              <td className="px-4 py-3">{c.nif ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
