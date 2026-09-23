import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Toast {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastInput {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((input: ToastInput) => {
    const id = Date.now()
    setToasts((atual) => [...atual, { id, ...input }])
    setTimeout(() => setToasts((atual) => atual.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t, i) => {
          const destaque = i === toasts.length - 1
          const Icon = t.variant === 'destructive' ? AlertCircle : CheckCircle2
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 rounded-lg px-4 py-3 shadow-lg text-sm text-white min-w-[240px] animate-toast-in transition-[opacity,transform] duration-200 ${
                t.variant === 'destructive' ? 'bg-danger' : 'bg-navy'
              } ${destaque ? 'opacity-100 scale-100' : 'opacity-80 scale-[0.98]'}`}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="opacity-90 mt-0.5">{t.description}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
