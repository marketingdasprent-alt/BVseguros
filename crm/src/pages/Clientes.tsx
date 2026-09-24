import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { NovoClienteForm } from '@/components/crm/NovoClienteForm'
import { ClientesTable } from '@/components/crm/ClientesTable'
import { FiltroResponsavel } from '@/components/crm/FiltroResponsavel'
import { AtribuirResponsavelModal } from '@/components/crm/AtribuirResponsavelModal'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useClientes, criarCliente, atribuirCliente } from '@/hooks/useClientes'
import { useEquipa } from '@/hooks/useEquipa'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import type { Cliente, ClienteInsert } from '@/lib/types'
import { mensagemErro } from '@/lib/erros'
import { filtrarPorResponsavel, lerFiltroResponsavel } from '@/lib/responsavel'

export default function Clientes() {
  const { data: clientes, isLoading, error, recarregar } = useClientes()
  const { toast } = useToast()
  const [aMostrarForm, setAMostrarForm] = useState(false)
  const [aCriar, setACriar] = useState(false)
  const [busca, setBusca] = useState('')
  const { ativos, nomePorId } = useEquipa()
  const { profile, isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [aAtribuir, setAAtribuir] = useState<Cliente | null>(null)
  const [aGuardarResponsavel, setAGuardarResponsavel] = useState(false)
  const filtro = lerFiltroResponsavel(searchParams.get('responsavel'))

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const porResponsavel = filtrarPorResponsavel(clientes, filtro, profile?.id ?? null)
    if (!termo) return porResponsavel
    return porResponsavel.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.telefone.toLowerCase().includes(termo) ||
        (c.email ?? '').toLowerCase().includes(termo) ||
        (c.nif ?? '').toLowerCase().includes(termo),
    )
  }, [clientes, busca, filtro, profile?.id])

  const handleAtribuir = async (cliente: Cliente, responsavelId: string | null) => {
    setAGuardarResponsavel(true)
    try {
      await atribuirCliente(cliente.id, responsavelId)
      await recarregar()
      setAAtribuir(null)
      toast({ title: responsavelId === profile?.id ? 'Cliente assumido' : 'Responsável atualizado' })
    } catch (err: unknown) {
      toast({ title: 'Erro ao atribuir cliente', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardarResponsavel(false)
    }
  }

  const handleCriar = async (cliente: ClienteInsert) => {
    setACriar(true)
    try {
      await criarCliente(cliente)
      await recarregar()
      setAMostrarForm(false)
      toast({ title: 'Cliente criado com sucesso' })
      return true;
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar cliente', description: mensagemErro(err), variant: 'destructive' })
      return false;
    } finally {
      setACriar(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description={<> {clientes.length} {clientes.length === 1 ? 'cliente registado' : 'clientes registados'} </>} action={<Button icon={<Plus />} onClick={() => setAMostrarForm((v) => !v)}>
          Novo cliente
        </Button>} />

      {aMostrarForm && <NovoClienteForm aCriar={aCriar} onCriar={handleCriar} />}

      {isLoading && <Spinner />}
      {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger-text">Erro ao carregar clientes: {error.message}</p>}

      {!isLoading && !error && clientes.length === 0 && (
        <div className="panel">
          <EmptyState titulo="Sem clientes ainda" descricao="Clientes convertidos de leads aparecem aqui." />
        </div>
      )}

      {!isLoading && !error && clientes.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
          <FiltroResponsavel valor={filtro} onChange={(valor) => setSearchParams(valor === 'todos' ? {} : { responsavel: valor }, { replace: true })} />
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar clientes por nome, telefone, email ou NIF"
              placeholder="Nome, telefone, email ou NIF"
              className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>
          </div>

          {clientesFiltrados.length === 0 ? (
            <div className="panel">
              <EmptyState titulo="Sem resultados" descricao={busca ? `Nenhum cliente corresponde a "${busca}".` : 'Nenhum cliente com este filtro.'} />
            </div>
          ) : (
            <ClientesTable
              clientes={clientesFiltrados}
              nomePorId={nomePorId}
              podeAtribuir={isAdmin}
              onAtribuir={setAAtribuir}
              onAssumir={(c) => profile && handleAtribuir(c, profile.id)}
            />
          )}
        </>
      )}

      {aAtribuir && (
        <AtribuirResponsavelModal
          nomeRegisto={aAtribuir.nome}
          responsavelAtual={aAtribuir.responsavel_id}
          membros={ativos}
          aGuardar={aGuardarResponsavel}
          onFechar={() => setAAtribuir(null)}
          onConfirmar={(responsavelId) => handleAtribuir(aAtribuir, responsavelId)}
        />
      )}
    </div>
  )
}
