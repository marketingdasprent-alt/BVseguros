import { useState, type FormEvent } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Notice } from '@/components/ui/Notice'
import { Campo, CLASSE_INPUT, RodapeFormulario } from '@/components/ui/Campo'
import { permissoesVazias } from '@/hooks/useGrupos'
import { MODULOS, normalizarPermissao } from '@/lib/permissoes'
import type { Carteira, DefinicaoModulo, Modulo, NivelAcesso, PermissaoModulo } from '@/lib/permissoes'
import type { GrupoEdicao } from '@/lib/types'
import { Segmented } from '@/components/ui/Segmented'

interface GrupoModalProps {
  // Sem id é um grupo novo (também ao duplicar).
  inicial?: { id?: string } & Partial<GrupoEdicao>
  aGuardar: boolean
  onGuardar: (dados: GrupoEdicao) => Promise<void>
  onFechar: () => void
  onApagar?: () => void
}

const NIVEIS: { valor: NivelAcesso; rotulo: string }[] = [
  { valor: 'nenhum', rotulo: 'Sem acesso' },
  { valor: 'ver', rotulo: 'Ver' },
  { valor: 'editar', rotulo: 'Ver e editar' },
]

export function GrupoModal({ inicial, aGuardar, onGuardar, onFechar, onApagar }: GrupoModalProps) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [carteira, setCarteira] = useState<Carteira>(inicial?.carteira ?? 'toda')
  const [permissoes, setPermissoes] = useState<Record<Modulo, PermissaoModulo>>(inicial?.permissoes ?? permissoesVazias())

  const mudar = (modulo: DefinicaoModulo, parcial: Partial<PermissaoModulo>) =>
    setPermissoes((atuais) => ({ ...atuais, [modulo.id]: normalizarPermissao(modulo, { ...atuais[modulo.id], ...parcial }) }))

  const todos = (nivel: NivelAcesso) =>
    setPermissoes(Object.fromEntries(MODULOS.map((m) => [m.id, normalizarPermissao(m, { nivel, apagar: false, atribuir: false })])) as Record<Modulo, PermissaoModulo>)

  const semNada = MODULOS.every((m) => permissoes[m.id].nivel === 'nenhum')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onGuardar({ nome: nome.trim(), descricao: descricao.trim() || null, carteira, permissoes })
  }

  return (
    <Modal title={inicial?.id ? 'Editar grupo' : 'Novo grupo'} subtitle={inicial?.id ? inicial.nome : undefined} largo onClose={onFechar} busy={aGuardar}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Nome do grupo" required>
            <input required minLength={2} maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Comercial, Backoffice" className={CLASSE_INPUT} data-autofocus />
          </Campo>
          <Campo label="Descrição">
            <input maxLength={300} value={descricao} onChange={(e) => setDescricao(e.target.value)}
              placeholder="Para que serve este grupo" className={CLASSE_INPUT} />
          </Campo>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-ink">Carteira</legend>
          <Segmented rotulo="Carteira" valor={carteira} onChange={setCarteira} opcoes={[
            { valor: 'toda', rotulo: 'Toda a carteira' },
            { valor: 'propria', rotulo: 'Só a sua carteira' },
          ]} />
          <p className="text-xs text-muted">
            {carteira === 'toda'
              ? 'Vê os leads e clientes de toda a equipa (nos módulos que tiver).'
              : 'Vê só os leads e clientes de que é responsável, e os que ainda não têm responsável (para os poder assumir). Apólices, propostas, renovações, sinistros e tarefas seguem o cliente.'}
          </p>
        </fieldset>

        <section className="space-y-3" aria-labelledby="titulo-permissoes">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 id="titulo-permissoes" className="text-sm font-semibold text-ink">Permissões por módulo</h3>
              <p className="text-xs text-muted">O que este grupo pode fazer em cada parte do CRM.</p>
            </div>
            {/* Ações de uma vez, não uma escolha: mesmo desenho, sem aria-pressed. */}
            <div role="group" aria-label="Acesso rápido a todos os módulos" className="segmented segmented--acoes">
              <button type="button" onClick={() => todos('nenhum')}>Nenhum</button>
              <button type="button" onClick={() => todos('ver')}>Todos ver</button>
              <button type="button" onClick={() => todos('editar')}>Todos editar</button>
            </div>
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {MODULOS.map((m) => {
              const p = permissoes[m.id]
              const niveis = m.soVer ? NIVEIS.filter((n) => n.valor !== 'editar') : NIVEIS
              return (
                <li key={m.id} className="space-y-3 p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p id={`modulo-${m.id}`} className="text-sm font-medium text-ink">{m.rotulo}</p>
                      <p className="text-xs text-muted">{m.descricao}</p>
                    </div>
                    <Segmented rotuloId={`modulo-${m.id}`} className="shrink-0" opcoes={niveis} valor={p.nivel}
                      onChange={(nivel) => mudar(m, { nivel })} />
                  </div>
                  {p.nivel === 'editar' && (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink">
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={p.apagar} onChange={(e) => mudar(m, { apagar: e.target.checked })} />
                        Pode apagar
                      </label>
                      {m.temAtribuir && (
                        <label className="inline-flex items-center gap-2">
                          <input type="checkbox" checked={p.atribuir} onChange={(e) => mudar(m, { atribuir: e.target.checked })} />
                          Pode passar a outro responsável
                        </label>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {semNada && (
          <Notice tone="info" icon={AlertTriangle}>
            Com todos os módulos em "Sem acesso", quem estiver neste grupo entra no CRM mas não vê nada.
          </Notice>
        )}
        <Notice icon={Info}>
          Utilizadores, grupos, seguradoras e importação continuam só para administradores. As alterações valem logo na base de dados; o menu de cada pessoa atualiza quando ela recarregar a página.
        </Notice>

        <RodapeFormulario aGuardar={aGuardar} textoGuardar={inicial?.id ? 'Guardar alterações' : 'Criar grupo'} onCancelar={onFechar} onApagar={onApagar} />
      </form>
    </Modal>
  )
}
