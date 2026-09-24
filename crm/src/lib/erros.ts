// Traduz erros do Postgres/Supabase (código + texto da constraint) para mensagens
// compreensíveis em PT-PT. O erro técnico original fica sempre no console para
// diagnóstico — nunca é só engolido.
export function mensagemErro(erro: unknown): string {
  if (!(erro instanceof Error)) return 'Erro inesperado.'

  console.error(erro)
  const msg = erro.message
  const codigo = (erro as { code?: string }).code

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

  return 'Não foi possível concluir. Tenta novamente ou contacta o suporte se persistir.'
}
