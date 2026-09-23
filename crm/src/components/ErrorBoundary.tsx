import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  erro: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { erro: null }

  static getDerivedStateFromError(erro: Error): ErrorBoundaryState {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error(erro, info.componentStack)
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sand p-6">
          <div className="panel form-panel max-w-md text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-navy">Ocorreu um erro inesperado</h1>
            <p className="text-sm text-muted">
              A aplicação encontrou um problema e não pode continuar. Recarregue a página — se o erro
              persistir, contacte o suporte.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="button inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
