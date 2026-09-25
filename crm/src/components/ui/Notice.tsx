import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface NoticeProps {
  tone?: 'neutral' | 'info' | 'danger'
  icon: LucideIcon
  children: ReactNode
  action?: ReactNode
  alerta?: boolean
}

export function Notice({ tone = 'neutral', icon: Icon, children, action, alerta = false }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={alerta ? 'alert' : undefined}>
      <Icon size={16} aria-hidden="true" />
      <div className={`notice-body${action ? ' notice-action' : ''}`}>
        <div className="min-w-0 flex-1">{children}</div>
        {action}
      </div>
    </div>
  )
}
