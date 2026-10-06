import { useState } from 'react'
import { AlertTriangle, Download, EyeOff } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Campo, CLASSE_INPUT } from '@/components/ui/Campo'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { anonimizarCliente, exportarCliente } from '@/hooks/useRgpd'
import { descarregarFicheiro } from '@/lib/descarregar'
import { guardarXlsx, titulo } from '@/lib/folhaExcel'
import { folhasExportacao, nomeFicheiroExportacao } from '@/lib/rgpd'
import { dataLocalIso } from '@/lib/format'
import { mensagemErro } from '@/lib/erros'
import type { Cliente } from '@/lib/types'

/** RGPD na ficha do cliente (só admin): painel com exportar e anonimizar, e o modal de confirmação. */
export function useRgpdCliente(cliente: Cliente | null, onAlterado: () => Promise<unknown>) {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [aExportar, setAExportar] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [nomeEscrito, setNomeEscrito] = useState('')
  const [aAnonimizar, setAAnonimizar] = useState(false)

  if (!isAdmin || !cliente) return { painel: null, modal: null }

  // Pedido de acesso: um Excel para a pessoa ler e um JSON completo (portabilidade).
  const exportar = async () => {
    setAExportar(true)
    try {
      const dados = await exportarCliente(cliente.id)
      const nome = nomeFicheiroExportacao(cliente.nome, dataLocalIso())
      await guardarXlsx(`${nome}.xlsx`, folhasExportacao(dados).map(({ nome: sheet, linhas: [cabecalho, ...resto] }) => ({
        sheet, data: [cabecalho.map(titulo), ...resto], stickyRowsCount: 1,
      })))
      descarregarFicheiro(`${nome}.json`, JSON.stringify(dados, null, 2), 'application/json')
      await onAlterado()
      toast({ title: 'Dados exportados', description: 'Dois ficheiros: Excel, para ler, e JSON, completo.' })
    } catch (err: unknown) {
      toast({ title: 'Não foi possível exportar os dados', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAExportar(false)
    }
  }

  const fechar = () => { setConfirmar(false); setNomeEscrito('') }
  const nomeCerto = nomeEscrito.trim() === cliente.nome.trim()

  const anonimizar = async () => {
    setAAnonimizar(true)
    try {
      await anonimizarCliente(cliente.id, nomeEscrito)
      fechar()
      await onAlterado()
      toast({ title: 'Cliente anonimizado' })
    } catch (err: unknown) {
      toast({ title: 'Não foi possível anonimizar', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAAnonimizar(false)
    }
  }

  // Fora do cabeçalho: são ações raras e uma é irreversível, não competem com Editar / Nova apólice.
  const painel = (
    <section className="panel">
      <div className="panel-heading flex-wrap">
        <div>
          <h2>Dados pessoais (RGPD)</h2>
          <p>Para pedidos de acesso ou de apagamento feitos pelo cliente. Só administradores.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download />} loading={aExportar} onClick={exportar}>Exportar dados</Button>
          <Button variant="ghost-danger" icon={<EyeOff />} onClick={() => setConfirmar(true)}>Anonimizar</Button>
        </div>
      </div>
    </section>
  )

  const modal = confirmar && (
    <Modal title="Anonimizar cliente" subtitle={cliente.nome} onClose={fechar} busy={aAnonimizar}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-ink">
          Para um pedido de apagamento (RGPD). Os dados pessoais saem de todo o CRM; ficam as apólices, ramos,
          prémios, datas e estados, para estatística.
        </p>
        <Notice tone="danger" icon={AlertTriangle}>
          <p className="font-medium">Irreversível. Deixam de existir:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>nome, telefone, email, NIF e morada do cliente e do lead de origem;</li>
            <li>a mensagem do site, os pedidos de sinistro e o texto livre de sinistros, atividades e notas;</li>
            <li>os valores guardados no histórico de alterações.</li>
          </ul>
        </Notice>
        <Campo label={`Escreva "${cliente.nome}" para confirmar`}>
          <input className={CLASSE_INPUT} value={nomeEscrito} onChange={(e) => setNomeEscrito(e.target.value)} autoComplete="off" />
        </Campo>
        <div className="form-footer"><div className="form-footer-end">
          <Button variant="secondary" disabled={aAnonimizar} onClick={fechar} data-autofocus>Cancelar</Button>
          <Button variant="danger" loading={aAnonimizar} disabled={!nomeCerto} onClick={anonimizar}>Anonimizar cliente</Button>
        </div></div>
      </div>
    </Modal>
  )

  return { painel, modal }
}
