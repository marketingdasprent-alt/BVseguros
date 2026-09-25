import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertTriangle, Building2, Eye, EyeOff, PenLine, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Notice } from '@/components/ui/Notice'
import { EmptyState } from '@/components/ui/EmptyState'
import { RowActions } from '@/components/ui/RowActions'
import { NomeSeguradoraModal } from '@/components/crm/NomeSeguradoraModal'
import { useSeguradoras, criarSeguradora, renomearSeguradora, alterarAtivaSeguradora } from '@/hooks/useSeguradoras'
import { useApolices } from '@/hooks/useApolices'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { mensagemErro } from '@/lib/erros'
import type { Seguradora } from '@/lib/types'

export default function Seguradoras() {
  const { isAdmin } = useAuth()
  const { data: seguradoras, isLoading, error, recarregar } = useSeguradoras()
  const { data: apolices, recarregar: recarregarApolices } = useApolices()
  const { toast } = useToast()
  const [modal, setModal] = useState<{ atual?: Seguradora } | null>(null)
  const [aGuardar, setAGuardar] = useState(false)

  const apolicesPorNome = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of apolices) m.set(a.seguradora.toLowerCase(), (m.get(a.seguradora.toLowerCase()) ?? 0) + 1)
    return m
  }, [apolices])

  if (!isAdmin) return <Navigate to="/" replace />

  const executar = async (acao: () => Promise<void>, sucesso: string, fechar = false) => {
    setAGuardar(true)
    try {
      await acao()
      await Promise.all([recarregar(), recarregarApolices()])
      if (fechar) setModal(null)
      toast({ title: sucesso })
    } catch (err: unknown) {
      toast({ title: 'Não foi possível guardar', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Seguradoras"
        description="A lista que aparece nos formulários de apólices e propostas. Nomes novos escritos em «Outra…» entram aqui sozinhos; junte duplicados renomeando para o nome certo."
        action={<Button icon={<Plus />} onClick={() => setModal({})}>Nova seguradora</Button>} />

      {isLoading && <Spinner />}
      {error && (
        <Notice tone="danger" icon={AlertTriangle} alerta action={<Button variant="secondary" size="sm" onClick={() => recarregar()}>Tentar novamente</Button>}>
          Não foi possível carregar as seguradoras: {error.message}
        </Notice>
      )}
      {!isLoading && !error && seguradoras.length === 0 && (
        <div className="panel"><EmptyState icon={Building2} titulo="Sem seguradoras" descricao="Aparecem aqui as que forem usadas em apólices e propostas, ou que adicionar." /></div>
      )}
      {!isLoading && !error && seguradoras.length > 0 && (
        <div className="table-panel">
          <div className="data-panel-heading">Lista de seguradoras<span>{seguradoras.filter((s) => s.ativa).length} ativas de {seguradoras.length}</span></div>
          <div role="region" aria-label="Lista de seguradoras" tabIndex={0} className="overflow-x-auto scroll-thin">
            <table className="crm-table w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="font-semibold uppercase">Nome</th>
                  <th className="font-semibold uppercase">Estado</th>
                  <th className="text-right font-semibold uppercase">Apólices</th>
                  <th className="font-semibold uppercase"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {seguradoras.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="whitespace-nowrap">{s.nome}</td>
                    <td className="whitespace-nowrap"><Badge tone={s.ativa ? 'success' : 'neutral'}>{s.ativa ? 'Ativa' : 'Inativa'}</Badge></td>
                    <td className="whitespace-nowrap text-right tabular-nums">{apolicesPorNome.get(s.nome.toLowerCase()) ?? 0}</td>
                    <td className="whitespace-nowrap text-right">
                      <RowActions rotulo={`Ações de ${s.nome}`} desativado={aGuardar} acoes={[
                        { rotulo: 'Renomear ou juntar', icone: PenLine, onSelect: () => setModal({ atual: s }) },
                        s.ativa
                          ? { rotulo: 'Desativar (sai dos formulários)', icone: EyeOff, onSelect: () => executar(() => alterarAtivaSeguradora(s.id, false), `${s.nome} desativada`) }
                          : { rotulo: 'Ativar', icone: Eye, onSelect: () => executar(() => alterarAtivaSeguradora(s.id, true), `${s.nome} ativada`) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <NomeSeguradoraModal atual={modal.atual} existentes={seguradoras} aGuardar={aGuardar} onFechar={() => setModal(null)}
          onGuardar={(nome) => modal.atual
            ? executar(() => renomearSeguradora(modal.atual!.id, nome), 'Seguradora atualizada', true)
            : executar(() => criarSeguradora(nome), 'Seguradora adicionada', true)} />
      )}
    </div>
  )
}
