// Traduz erros do Postgres/Supabase (código + texto da constraint) para mensagens
// compreensíveis em PT-PT. O erro técnico original fica sempre no console para
// diagnóstico — nunca é só engolido.
export function mensagemErro(erro: unknown): string {
  // Os erros do Supabase (PostgrestError) chegam como objetos simples com message/code,
  // não como instâncias de Error; sem isto todos apareciam como "Erro inesperado".
  const campos = (typeof erro === 'object' && erro !== null ? erro : {}) as { message?: unknown; code?: unknown }
  const msg = erro instanceof Error ? erro.message : typeof campos.message === 'string' ? campos.message : null
  if (msg === null) return 'Erro inesperado.'

  console.error(erro)
  const codigo = typeof campos.code === 'string' ? campos.code : undefined

  if (codigo === '23505' || msg.includes('duplicate key')) {
    if (msg.includes('nif')) return 'Já existe um cliente registado com este NIF.'
    if (msg.includes('numero_apolice') || msg.includes('numero_unico')) return 'Já existe uma apólice com este número.'
    return 'Este registo já existe (valor duplicado).'
  }

  if (codigo === '23514' || msg.includes('violates check constraint')) {
    if (msg.includes('nao_negativo')) return 'O valor não pode ser negativo.'
    if (msg.includes('nao_futura')) return 'A data de ocorrência não pode ser no futuro.'
    if (msg.includes('nif_formato')) return 'NIF inválido — deve ter exatamente 9 dígitos.'
    if (msg.includes('nome_valido')) return 'O nome deve ter pelo menos 2 caracteres.'
    return 'Um dos valores introduzidos não é válido.'
  }

  if (msg.includes('CONFLITO')) return msg.replace('CONFLITO: ', '')

  return 'Não foi possível concluir. Tente novamente ou contacte o suporte se persistir.'
}
