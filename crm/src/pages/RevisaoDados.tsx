import { Navigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Notice } from '@/components/ui/Notice'
import { ErroCarregar } from '@/components/ui/ErroCarregar'
import { TabelaRevisao, type LinhaRevisao } from '@/components/crm/TabelaRevisao'
import { useAuth } from '@/hooks/useAuth'
import { useRevisaoDados } from '@/hooks/useRgpd'
import { useConfirmarApagar } from '@/hooks/useConfirmarApagar'
import { apagarLead } from '@/hooks/useLeads'
import { PRAZO_REVISAO_MESES } from '@/lib/rgpd'
import type { Lead, PedidoSinistro } from '@/lib/types'

const abrirLead = (l: Lead) => `/leads?q=${encodeURIComponent(l.nome)}`
const linhaLead = (l: Lead, desde: string): LinhaRevisao => ({ id: l.id, nome: l.nome, contacto: l.email ?? l.telefone, desde, abrir: abrirLead(l) })
const linhaPedido = (p: PedidoSinistro): LinhaRevisao => ({ id: p.id, nome: p.nome, contacto: p.email, desde: p.atualizado_em, abrir: '/sinistros?vista=pedidos' })

// RGPD: o que passou o prazo de conservação, para o admin rever. Nada é apagado sozinho.
export default function RevisaoDados() {
  const { isAdmin } = useAuth()
  const { data, isLoading, error, recarregar } = useRevisaoDados(PRAZO_REVISAO_MESES)
  const { pedirConfirmacao, modalApagar } = useConfirmarApagar(() => recarregar())

  if (!isAdmin) return <Navigate to="/" replace />

  const apagar = (linha: LinhaRevisao) => pedirConfirmacao({
    acao: 'Apagar lead',
    nome: linha.nome,
    aviso: 'As propostas e atividades deste lead também são apagadas.',
    mensagemSucesso: 'Lead apagado',
    apagar: () => apagarLead(linha.id),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Revisão de dados"
        description={`Registos com mais de ${PRAZO_REVISAO_MESES} meses sem novidades, para decidir se ainda devem ser guardados (RGPD). Nada é apagado sozinho.`} />

      <Notice icon={Info}>
        O prazo de {PRAZO_REVISAO_MESES} meses é provisório, até a BV Seguros indicar o seu (questionário, ponto 7). Clientes
        com pedido de apagamento anonimizam-se na ficha do cliente.
      </Notice>

      {isLoading && !data && <Spinner />}
      {error && <ErroCarregar oQue="a revisão de dados" erro={error} onTentarNovamente={() => recarregar()} />}
      {data && (
        <>
          <TabelaRevisao titulo="Leads perdidos" descricao="Marcados como perdidos e sem alterações desde então."
            rotuloData="Perdido desde" linhas={data.leadsPerdidos.map((l) => linhaLead(l, l.atualizado_em))} onApagar={apagar} />
          <TabelaRevisao titulo="Pedidos do site sem resposta" descricao="Chegaram pelo site e continuam em Novo, sem responsável."
            rotuloData="Recebido em" linhas={data.pedidosSemResposta.map((l) => linhaLead(l, l.criado_em))} onApagar={apagar} />
          <TabelaRevisao titulo="Pedidos de sinistro arquivados" descricao="Pedidos do site arquivados há mais do que o prazo."
            rotuloData="Arquivado em" linhas={data.pedidosSinistroArquivados.map(linhaPedido)}
            nota="Só para rever: por decisão de 30/09/2026, os pedidos de sinistro ficam guardados." />
        </>
      )}
      {modalApagar}
    </div>
  )
}
