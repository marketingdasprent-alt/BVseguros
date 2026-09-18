interface EmptyStateProps {
  titulo: string
  descricao?: string
}

export function EmptyState({ titulo, descricao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-ink/50">
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="text-sm mt-1 max-w-sm">{descricao}</p>}
    </div>
  )
}
