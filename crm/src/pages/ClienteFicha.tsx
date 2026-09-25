import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Pencil, Plus, UserX } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pessoa } from '@/components/ui/Pessoa'
import { FichaResumo } from '@/components/crm/FichaResumo'
import { HistoricoRegistos } from '@/components/crm/HistoricoRegistos'
import { useHistoricoCliente } from '@/hooks/useHistorico'
import { FichaApolices, FichaAtividades, FichaPropostasSinistros } from '@/components/crm/FichaSecoes'
import { ClienteFormModal } from '@/components/crm/ClienteFormModal'
import { NovoApoliceForm } from '@/components/crm/NovoApoliceForm'
import { NovaAtividadeForm } from '@/components/crm/NovaAtividadeForm'
import { useFichaCliente } from '@/hooks/useFichaCliente'
import { atualizarCliente, apagarCliente } from '@/hooks/useClientes'
import { criarApolice } from '@/hooks/useApolices'
import { criarAtividade } from '@/hooks/useAtividades'
import { useEquipa } from '@/hooks/useEquipa'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { useSeguradoras } from '@/hooks/useSeguradoras'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { resumirCliente } from '@/lib/fichaCliente'
import { dataLocalIso } from '@/lib/format'
import { mensagemErro } from '@/lib/erros'
import type { ApoliceInsert, AtividadeInsert, ClienteEdicao } from '@/lib/types'

type Formulario = 'apolice' | 'atividade' | null

export default function ClienteFicha() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, error, naoExiste, recarregar } = useFichaCliente(id)
  const { nomePorId } = useEquipa()
  const historico = useHistoricoCliente(id)
  const { nomesAtivos: seguradoras } = useSeguradoras()
  const { isAdmin, profile } = useAuth()
  const { toast } = useToast()
  const [aEditar, setAEditar] = useState(false)
  const [formulario, setFormulario] = useState<Formulario>(null)
  const [aGuardar, setAGuardar] = useState(false)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(() => navigate('/clientes'))

  const resumo = useMemo(() => data && resumirCliente(data.apolices, data.sinistros, dataLocalIso()), [data])

  // Mesmo padrão das outras páginas: estado "a guardar", toast de erro e recarregar.
  const guardar = async (acao: () => Promise<unknown>, sucesso: string, tituloErro: string, fechar: () => void) => {
    setAGuardar(true)
    try {
      await acao()
      await Promise.all([recarregar(), historico.recarregar()])
      fechar()
      toast({ title: sucesso })
      return true
    } catch (err: unknown) {
      toast({ title: tituloErro, description: mensagemErro(err), variant: 'destructive' })
      return false
    } finally {
      setAGuardar(false)
    }
  }

  const voltar = <Link to="/clientes" className="text-link"><ArrowLeft size={14} />Clientes</Link>

  if (isLoading && !data) return <Spinner />
  if (naoExiste) {
    return (
      <div className="panel">
        <EmptyState icon={UserX} titulo="Cliente não encontrado" descricao="Pode ter sido apagado, ou o link está incompleto." action={voltar} />
      </div>
    )
  }
  if (error || !data || !resumo) {
    return (
      <Notice tone="danger" icon={AlertTriangle} alerta action={<Button variant="secondary" size="sm" onClick={() => recarregar()}>Tentar novamente</Button>}>
        Não foi possível carregar o cliente{error ? `: ${error.message}` : '.'}
      </Notice>
    )
  }

  const { cliente } = data
  const numeroApolice = (apoliceId: string) => data.apolices.find((a) => a.id === apoliceId)?.numero_apolice ?? '—'
  const contactos = [cliente.nif && `NIF ${cliente.nif}`, cliente.telefone, cliente.email, cliente.morada].filter(Boolean).join(' · ')

  return (
    <div className="space-y-6">
      <div>{voltar}</div>
      <PageHeader
        title={cliente.nome}
        description={<>
          <span className="block">{contactos}</span>
          <span className="mt-2 inline-flex items-center gap-2 text-[12px]">Responsável:
            <Pessoa nome={cliente.responsavel_id ? nomePorId.get(cliente.responsavel_id) ?? 'Atribuído' : null} />
          </span>
        </>}
        action={<>
          <Button variant="secondary" icon={<Pencil />} onClick={() => setAEditar(true)}>Editar</Button>
          <Button icon={<Plus />} onClick={() => setFormulario(formulario === 'apolice' ? null : 'apolice')}>Nova apólice</Button>
        </>}
      />

      <FichaResumo resumo={resumo} />

      {formulario === 'apolice' && (
        <NovoApoliceForm seguradoras={seguradoras} clientes={[cliente]} aCriar={aGuardar}
          onCriar={(dados: ApoliceInsert) => guardar(() => criarApolice(dados), 'Apólice criada', 'Erro ao criar apólice', () => setFormulario(null))} />
      )}
      <FichaApolices apolices={data.apolices} />

      <FichaPropostasSinistros propostas={data.propostas} sinistros={data.sinistros} numeroApolice={numeroApolice} />

      {formulario === 'atividade' && (
        <NovaAtividadeForm leads={[]} clientes={[cliente]} clienteFixoId={cliente.id} responsavelId={profile?.id ?? null} aCriar={aGuardar}
          onCriar={(dados: AtividadeInsert) => guardar(() => criarAtividade(dados), 'Atividade registada', 'Erro ao registar atividade', () => setFormulario(null))} />
      )}
      <FichaAtividades atividades={data.atividades}
        acao={<Button variant="secondary" size="sm" icon={<Plus />} onClick={() => setFormulario(formulario === 'atividade' ? null : 'atividade')}>Registar atividade</Button>} />

      <HistoricoRegistos entradas={historico.data} isLoading={historico.isLoading} error={historico.error}
        nomePessoa={(pessoa) => nomePorId.get(pessoa)} onTentarNovamente={() => historico.recarregar()} />

      {aEditar && (
        <ClienteFormModal
          titulo="Editar cliente"
          subtitulo={cliente.nome}
          inicial={cliente}
          textoGuardar="Guardar alterações"
          aGuardar={aGuardar}
          onFechar={() => setAEditar(false)}
          onGuardar={async (dados: ClienteEdicao) => { await guardar(() => atualizarCliente(cliente.id, dados), 'Cliente atualizado', 'Erro ao guardar cliente', () => setAEditar(false)) }}
          onApagar={isAdmin ? () => {
            setAEditar(false)
            pedirConfirmacao({
              acao: 'Apagar cliente',
              nome: cliente.nome,
              aviso: 'As apólices, renovações, sinistros, propostas e atividades deste cliente também são apagadas.',
              apagar: () => apagarCliente(cliente.id),
            })
          } : undefined}
        />
      )}
      {modalApagar}
    </div>
  )
}
