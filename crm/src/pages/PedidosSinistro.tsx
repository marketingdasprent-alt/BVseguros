import { useMemo, useState } from 'react'
import { Inbox } from 'lucide-react'
import { PedidosSinistroTabela } from '@/components/crm/PedidosSinistroTabela'
import { PedidoSinistroModal } from '@/components/crm/PedidoSinistroModal'
import { BarraPesquisa } from '@/components/crm/BarraPesquisa'
import { SemResultados } from '@/components/crm/SemResultados'
import { AvisoTruncado } from '@/components/crm/AvisoTruncado'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { atualizarPedidoSinistro, converterPedidoSinistro, usePedidosSinistro } from '@/hooks/usePedidosSinistro'
import { useClientes } from '@/hooks/useClientes'
import { useApolices } from '@/hooks/useApolices'
import { useAuth } from '@/hooks/useAuth'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl'
import { useToast } from '@/hooks/useToast'
import { corresponde } from '@/lib/pesquisa'
import { mensagemErro } from '@/lib/erros'
import type { EstadoPedidoSinistro, PedidoSinistro } from '@/lib/types'

type Filtro = 'abertos' | EstadoPedidoSinistro | 'todos'
const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'abertos', rotulo: 'Por tratar' },
  { valor: 'convertido', rotulo: 'Convertidos' },
  { valor: 'arquivado', rotulo: 'Arquivados' },
  { valor: 'todos', rotulo: 'Todos' },
]

// Separador "Pedidos do site" da página Sinistros: a caixa de entrada dos pedidos feitos no site.
export default function PedidosSinistro({ onConvertido }: { onConvertido: () => void }) {
  const { data: pedidos, isLoading, error, recarregar, truncado } = usePedidosSinistro()
  const { data: clientes, isLoading: clientesCarregando } = useClientes()
  const { data: apolices, isLoading: apolicesCarregando } = useApolices()
  const { pode, profile } = useAuth()
  const { toast } = useToast()
  const filtros = useFiltrosUrl()
  const filtro = filtros.ler('estado', 'abertos') as Filtro
  const termo = filtros.ler('q')
  const [abertoId, setAbertoId] = useState<string | null>(null)
  const [aGuardar, setAGuardar] = useState(false)

  const visiveis = useMemo(() => pedidos
    .filter((p) => filtro === 'todos' || (filtro === 'abertos' ? p.estado === 'novo' || p.estado === 'em_tratamento' : p.estado === filtro))
    .filter((p) => corresponde([p.nome, p.email, p.telefone, p.numero_apolice, p.descricao], termo)), [pedidos, filtro, termo])
  const aberto = pedidos.find((p) => p.id === abertoId) ?? null

  const executar = async (acao: () => Promise<unknown>, sucesso: string, fechar = false) => {
    setAGuardar(true)
    try {
      await acao()
      await recarregar()
      toast({ title: sucesso })
      if (fechar) setAbertoId(null)
    } catch (err: unknown) {
      toast({ title: 'Não foi possível guardar', description: mensagemErro(err), variant: 'destructive' })
      await recarregar()
    } finally {
      setAGuardar(false)
    }
  }

  const mudarEstado = (p: PedidoSinistro, estado: EstadoPedidoSinistro) =>
    executar(() => atualizarPedidoSinistro(p.id, { estado, ...(estado === 'em_tratamento' && !p.tratado_por ? { tratado_por: profile?.id ?? null } : {}) }, p.atualizado_em),
      estado === 'arquivado' ? 'Pedido arquivado' : estado === 'novo' ? 'Pedido reaberto' : 'Pedido em tratamento', estado === 'arquivado')

  if (isLoading || clientesCarregando || apolicesCarregando) return <Spinner />
  if (error) return <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar os pedidos: {error.message}</p>

  return (
    <div className="space-y-4">
      <AvisoTruncado truncado={truncado} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Estado dos pedidos" className="segmented">
          {FILTROS.map((f) => (
            <button key={f.valor} type="button" aria-pressed={filtro === f.valor} onClick={() => filtros.definir('estado', f.valor, 'abertos')}>{f.rotulo}</button>
          ))}
        </div>
      </div>
      <BarraPesquisa valor={termo} onChange={(v) => filtros.definir('q', v)} rotulo="Pesquisar pedidos" placeholder="Nome, email, telefone, nº de apólice ou descrição" />

      {pedidos.length === 0 ? (
        <EmptyState icon={Inbox} titulo="Ainda não há pedidos do site" descricao="Os pedidos feitos em Participar sinistro, no site, aparecem aqui." />
      ) : visiveis.length === 0 ? (
        termo ? <SemResultados termo={termo} onLimpar={() => filtros.definir('q', '')} />
          : <EmptyState icon={Inbox} titulo="Nenhum pedido neste estado" />
      ) : (
        <PedidosSinistroTabela pedidos={visiveis} onAbrir={(p) => setAbertoId(p.id)} />
      )}

      {aberto && (
        <PedidoSinistroModal
          key={aberto.id + aberto.atualizado_em}
          pedido={aberto}
          clientes={clientes}
          apolices={apolices}
          podeEditar={pode('sinistros', 'editar')}
          aGuardar={aGuardar}
          onFechar={() => setAbertoId(null)}
          onMudarEstado={(estado) => mudarEstado(aberto, estado)}
          onGuardarNotas={(notas) => executar(() => atualizarPedidoSinistro(aberto.id, { notas: notas || null }, aberto.atualizado_em), 'Notas guardadas')}
          onConverter={(apoliceId, descricao) => executar(async () => { await converterPedidoSinistro(aberto.id, apoliceId, descricao); onConvertido() }, 'Sinistro criado a partir do pedido', true)}
        />
      )}
    </div>
  )
}
