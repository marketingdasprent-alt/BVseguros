import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

// danger (vermelho cheio) só no botão que confirma apagar/excluir.
type Variant = 'primary' | 'secondary' | 'ghost' | 'ghost-danger' | 'destructive' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-navy text-white hover:bg-navy-dark',
  secondary: 'border border-border text-ink bg-white hover:border-border-strong',
  ghost: 'text-muted hover:text-ink hover:bg-ink/[0.03]',
  destructive: 'border border-danger/30 text-danger-text hover:bg-danger-bg',
  danger: 'bg-danger text-white hover:bg-[#d92d20]',
  'ghost-danger': 'text-danger-text hover:bg-danger-bg',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs gap-1.5',
  md: 'min-h-10 px-4 py-2 text-sm gap-2',
}

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 16 }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  type = 'button',
  children,
  className = '',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`button inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={ICON_SIZE[size]} className="animate-spin" />
      ) : (
        icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>
      )}
      {children}
    </button>
  )
})