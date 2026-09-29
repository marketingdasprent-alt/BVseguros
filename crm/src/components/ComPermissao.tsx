import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { MODULOS, rotaInicial } from '@/lib/permissoes'
import type { Modulo } from '@/lib/permissoes'

interface ComPermissaoProps {
  modulo: Modulo
  children: ReactNode
}

// Esconder é só UX: os dados já vêm vazios da RLS para quem não tem o módulo.
export function ComPermissao({ modulo, children }: ComPermissaoProps) {
  const { pode, permissoes, isAdmin } = useAuth()
  if (pode(modulo, 'ver')) return children

  const inicio = rotaInicial(pode)
  // Sem Dashboard, a página inicial passa a ser o primeiro módulo do grupo.
  if (modulo === 'dashboard' && inicio) return <Navigate to={inicio} replace />

  const semGrupo = !isAdmin && !permissoes?.grupo
  const rotulo = MODULOS.find((m) => m.id === modulo)?.rotulo ?? modulo
  return (
    <div className="panel">
      <EmptyState
        icon={Lock}
        titulo={inicio ? `Sem acesso a ${rotulo}` : 'Ainda sem módulos'}
        descricao={semGrupo
          ? 'A sua conta ainda não pertence a nenhum grupo. Peça ao administrador para a associar a um.'
          : inicio ? 'O seu grupo não inclui este módulo. Se precisar dele, fale com o administrador.' : 'O seu grupo ainda não tem nenhum módulo. Fale com o administrador.'}
        action={inicio ? <Link to={inicio} className="text-link">Ir para o início</Link> : undefined}
      />
    </div>
  )
}
