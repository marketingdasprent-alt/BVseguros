import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// Filtros na URL (AGENTS.md secção 6: partilháveis). Mudar um não apaga os outros;
// o valor por omissão não fica na URL, para ela continuar limpa.
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams()

  const ler = useCallback((chave: string, omissao = '') => params.get(chave) ?? omissao, [params])

  const definir = useCallback(
    (chave: string, valor: string, omissao = '') => {
      setParams((atuais) => {
        const novos = new URLSearchParams(atuais)
        if (!valor || valor === omissao) novos.delete(chave)
        else novos.set(chave, valor)
        return novos
      }, { replace: true })
    },
    [setParams],
  )

  const limpar = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  return { ler, definir, limpar, temFiltros: params.toString() !== '' }
}
