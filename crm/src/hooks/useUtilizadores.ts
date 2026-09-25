import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSupabaseTable } from '@/hooks/useSupabaseTable'
import type { AlteracaoAcesso, EstadoConta, EventoAcesso, Profile } from '@/lib/types'

// A RLS só devolve todas as contas a um admin ativo; os outros veem apenas a sua.
export function useUtilizadores() {
  return useSupabaseTable<Profile>('profiles', 'criado_em', true)
}

// Só o admin lê o histórico (RLS de eventos_acesso).
export function useEventosAcesso() {
  return useSupabaseTable<EventoAcesso>('eventos_acesso', 'criado_em')
}

export async function alterarAcesso(id: string, alteracao: AlteracaoAcesso) {
  const { data, error } = await supabase.from('profiles').update(alteracao).eq('id', id).select().single()
  if (error) throw error
  return data as Profile
}

interface RespostaApi {
  message?: string
  error?: string
  estados?: Record<string, EstadoConta>
}

// Convites, estado das contas e exclusões passam pela função da Vercel (api/utilizadores.js):
// exigem a service-role key.
async function chamarApiUtilizadores(method: 'GET' | 'POST' | 'DELETE', corpoPedido: object | null, erroPadrao: string): Promise<RespostaApi> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('CONFLITO: A sessão expirou. Inicie sessão novamente.')

  const resposta = await fetch('/api/utilizadores', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: corpoPedido ? JSON.stringify(corpoPedido) : undefined,
  })
  const corpo = (await resposta.json().catch(() => ({}))) as RespostaApi
  if (!resposta.ok) throw new Error(`CONFLITO: ${corpo.error ?? erroPadrao}`)
  return corpo
}

export async function convidarUtilizador(nome: string, email: string) {
  return (await chamarApiUtilizadores('POST', { nome, email }, 'Não foi possível enviar o convite.')).message ?? ''
}

export async function reenviarConvite(id: string) {
  return (await chamarApiUtilizadores('POST', { acao: 'reenviar', id }, 'Não foi possível reenviar o convite.')).message ?? ''
}

export async function excluirUtilizador(id: string) {
  return (await chamarApiUtilizadores('DELETE', { id }, 'Não foi possível excluir a conta.')).message ?? ''
}

// Convite pendente e último acesso vêm do Auth; sem a service-role key configurada a lista
// continua a funcionar, só sem estas duas informações.
export function useEstadosContas() {
  const [data, setData] = useState<Record<string, EstadoConta>>({})
  const [error, setError] = useState<Error | null>(null)

  const recarregar = useCallback(async () => {
    try {
      const corpo = await chamarApiUtilizadores('GET', null, 'Não foi possível obter o estado das contas.')
      setData(corpo.estados ?? {})
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error('Erro inesperado'))
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  return { data, error, recarregar }
}

export async function alterarNome(id: string, nome: string) {
  const { error } = await supabase.from('profiles').update({ nome: nome.trim() }).eq('id', id)
  if (error) throw error
}
