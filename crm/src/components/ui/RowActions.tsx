import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, type LucideIcon } from 'lucide-react'

export interface AcaoLinha {
  rotulo: string
  icone: LucideIcon
  onSelect: () => void
  perigo?: boolean
  separadorAntes?: boolean
}

interface RowActionsProps {
  acoes: AcaoLinha[]
  rotulo: string
  desativado?: boolean
}

const LARGURA_MENU = 220

// Menu "⋯" das linhas das tabelas. Fixo ao viewport para não ser cortado pelo
// overflow:hidden dos painéis; fecha com Esc, clique fora, scroll ou Tab.
export function RowActions({ acoes, rotulo, desativado = false }: RowActionsProps) {
  const [aberto, setAberto] = useState(false)
  const [posicao, setPosicao] = useState({ top: 0, left: 0 })
  const botao = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const fechar = (devolverFoco: boolean) => {
    setAberto(false)
    if (devolverFoco) botao.current?.focus()
  }

  useLayoutEffect(() => {
    if (!aberto || !botao.current) return
    const r = botao.current.getBoundingClientRect()
    const alturaMenu = menu.current?.offsetHeight ?? 0
    const abreParaCima = r.bottom + 6 + alturaMenu > window.innerHeight - 8
    setPosicao({
      top: abreParaCima ? Math.max(8, r.top - 6 - alturaMenu) : r.bottom + 6,
      left: Math.max(8, Math.min(r.right - LARGURA_MENU, window.innerWidth - LARGURA_MENU - 8)),
    })
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const foraDoMenu = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !botao.current?.contains(e.target as Node)) fechar(false)
    }
    const aoRolar = () => fechar(false)
    document.addEventListener('mousedown', foraDoMenu)
    window.addEventListener('scroll', aoRolar, true)
    window.addEventListener('resize', aoRolar)
    return () => {
      document.removeEventListener('mousedown', foraDoMenu)
      window.removeEventListener('scroll', aoRolar, true)
      window.removeEventListener('resize', aoRolar)
    }
  }, [aberto])

  const handleTeclas = (e: ReactKeyboardEvent) => {
    const itens = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
    const atual = itens.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const passo = e.key === 'ArrowDown' ? 1 : -1
      itens[(atual + passo + itens.length) % itens.length]?.focus()
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      itens[e.key === 'Home' ? 0 : itens.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      fechar(true)
    } else if (e.key === 'Tab') {
      fechar(false)
    }
  }

  if (acoes.length === 0) return null

  return (
    <>
      <button ref={botao} type="button" className="icon-button" aria-label={rotulo} aria-haspopup="menu"
        aria-expanded={aberto} aria-controls={aberto ? menuId : undefined} disabled={desativado}
        onClick={() => (aberto ? fechar(false) : setAberto(true))}>
        <MoreHorizontal size={18} />
      </button>
      {aberto && createPortal(
        <div ref={menu} id={menuId} role="menu" aria-label={rotulo} className="row-menu"
          style={{ top: posicao.top, left: posicao.left, width: LARGURA_MENU }} onKeyDown={handleTeclas}>
          {acoes.map(({ rotulo: r, icone: Icone, onSelect, perigo, separadorAntes }) => (
            <div key={r}>
              {separadorAntes && <hr />}
              <button type="button" role="menuitem" tabIndex={-1} className={perigo ? 'is-danger' : undefined}
                onClick={() => { fechar(true); onSelect() }}>
                <Icone size={15} aria-hidden="true" />
                {r}
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
