import { Inbox, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  titulo: string
  descricao?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function EmptyState({ titulo, descricao, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center text-muted">
      <div className="mb-4 rounded-xl border border-border bg-sand p-3"><Icon size={26} strokeWidth={1.5} className="text-muted" /></div>
      <p className="font-medium text-ink">{titulo}</p>
      {descricao && <p className="text-sm mt-2 max-w-sm leading-relaxed">{descricao}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
