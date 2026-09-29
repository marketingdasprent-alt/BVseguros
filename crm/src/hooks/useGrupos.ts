import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MODULOS, SEM_PERMISSAO, normalizarPermissao } from '@/lib/permissoes'
import type { Modulo, NivelAcesso, PermissaoModulo } from '@/lib/permissoes'
import type { Grupo, GrupoComPermissoes, GrupoEdicao } from '@/lib/types'

interface LinhaPermissao {
  grupo_id: string
  modulo: Modulo
  nivel: NivelAcesso
  pode_apagar: boolean
  pode_atribuir: boolean
}

export function permissoesVazias(): Record<Modulo, PermissaoModulo> {
  return Object.fromEntries(MODULOS.map((m) => [m.id, { ...SEM_PERMISSAO }])) as Record<Modulo, PermissaoModulo>
}

// Só o admin vê todos os grupos (RLS de grupos); os outros veem apenas o seu.
export function useGrupos() {
  const [data, setData] = useState<GrupoComPermissoes[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    setIsLoading(true)
    try {
      const [grupos, permissoes, perfis] = await Promise.all([
        supabase.from('grupos').select('*').order('nome'),
        supabase.from('grupo_permissoes').select('*'),
        supabase.from('profiles').select('grupo_id').not('grupo_id', 'is', null),
      ])
      const erro = grupos.error ?? permissoes.error ?? perfis.error
      if (erro) throw erro
      const membros = new Map<string, number>()
      for (const p of (perfis.data ?? []) as { grupo_id: string }[]) membros.set(p.grupo_id, (membros.get(p.grupo_id) ?? 0) + 1)
      setData(((grupos.data ?? []) as Grupo[]).map((g) => {
        const perms = permissoesVazias()
        for (const l of (permissoes.data ?? []) as LinhaPermissao[]) {
          if (l.grupo_id === g.id) perms[l.modulo] = { nivel: l.nivel, apagar: l.pode_apagar, atribuir: l.pode_atribuir }
        }
        return { ...g, permissoes: perms, membros: membros.get(g.id) ?? 0 }
      }))
      setError(null)
    } catch (err: unknown) {
      const mensagem = (err as { message?: unknown })?.message
      setError(err instanceof Error ? err : new Error(typeof mensagem === 'string' ? mensagem : 'Erro inesperado'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, isLoading, error, recarregar }
}

// Grupo e permissões numa só transação (guardar_grupo), para não ficar um grupo a meio.
export async function guardarGrupo(id: string | null, dados: GrupoEdicao) {
  const permissoes = MODULOS.map((m) => {
    const p = normalizarPermissao(m, dados.permissoes[m.id])
    return { modulo: m.id, nivel: p.nivel, apagar: p.apagar, atribuir: p.atribuir }
  })
  const { error } = await supabase.rpc('guardar_grupo', {
    p_id: id, p_nome: dados.nome, p_descricao: dados.descricao, p_carteira: dados.carteira, p_permissoes: permissoes,
  })
  if (error) throw error
}

export async function apagarGrupo(id: string) {
  const { error } = await supabase.from('grupos').delete().eq('id', id)
  if (error) throw error
}
