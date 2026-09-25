export function iniciais(nome: string): string {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0] ?? '').join('').toUpperCase()
}

interface PessoaProps {
  nome: string | null
  semNome?: string
}

// Mini avatar + nome, para responsáveis em cartões, tabelas e escolhas.
export function Pessoa({ nome, semNome = 'Sem responsável' }: PessoaProps) {
  if (!nome) return <span className="text-[11px] text-muted">{semNome}</span>
  return (
    <span className="person" title={nome}>
      <span className="mini-avatar" aria-hidden="true">{iniciais(nome)}</span>
      <span>{nome}</span>
    </span>
  )
}
