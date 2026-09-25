import { describe, expect, it } from 'vitest'
import { mensagemErro } from '@/lib/erros'

describe('mensagemErro', () => {
  it('devolve mensagem genérica para valores que não são Error', () => {
    expect(mensagemErro('qualquer coisa')).toBe('Erro inesperado.')
    expect(mensagemErro(null)).toBe('Erro inesperado.')
  })

  it('identifica duplicado de NIF', () => {
    const erro = Object.assign(new Error('duplicate key value violates unique constraint "clientes_nif_unico"'), { code: '23505' })
    expect(mensagemErro(erro)).toBe('Já existe um cliente registado com este NIF.')
  })

  it('identifica duplicado de número de apólice', () => {
    const erro = Object.assign(new Error('duplicate key value violates unique constraint "apolices_numero_unico"'), { code: '23505' })
    expect(mensagemErro(erro)).toBe('Já existe uma apólice com este número.')
  })

  it('identifica valor negativo por violação de check constraint', () => {
    const erro = Object.assign(new Error('violates check constraint "apolices_premio_nao_negativo"'), { code: '23514' })
    expect(mensagemErro(erro)).toBe('O valor não pode ser negativo.')
  })

  it('identifica data de sinistro no futuro', () => {
    const erro = Object.assign(new Error('violates check constraint "sinistros_data_nao_futura"'), { code: '23514' })
    expect(mensagemErro(erro)).toBe('A data de ocorrência não pode ser no futuro.')
  })

  it('identifica NIF com formato inválido', () => {
    const erro = Object.assign(new Error('violates check constraint "clientes_nif_formato"'), { code: '23514' })
    expect(mensagemErro(erro)).toBe('NIF inválido — deve ter exatamente 9 dígitos.')
  })

  it('extrai a mensagem de um conflito de concorrência', () => {
    const erro = new Error('CONFLITO: este lead foi alterado por outra pessoa entretanto. Atualize a página e tente novamente.')
    expect(mensagemErro(erro)).toBe('este lead foi alterado por outra pessoa entretanto. Atualize a página e tente novamente.')
  })

  it('cai numa mensagem genérica para erros não reconhecidos', () => {
    const erro = new Error('falha de rede qualquer')
    expect(mensagemErro(erro)).toBe('Não foi possível concluir. Tente novamente ou contacte o suporte se persistir.')
  })
  // Forma real dos erros do Supabase: objeto simples, não instância de Error.
  it('lê erros do Supabase que chegam como objetos simples', () => {
    const conflito = { message: 'CONFLITO: Este lead já foi convertido em cliente.', code: 'P0001', details: null, hint: null }
    expect(mensagemErro(conflito)).toBe('Este lead já foi convertido em cliente.')
    const duplicado = { message: 'duplicate key value violates unique constraint "clientes_nif_unico"', code: '23505' }
    expect(mensagemErro(duplicado)).toBe('Já existe um cliente registado com este NIF.')
  })
})