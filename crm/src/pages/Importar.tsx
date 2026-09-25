import { useRef, useState, type ChangeEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Download, FileUp, Info, RotateCcw, Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Contagens, ListaErros } from '@/components/crm/ImportacaoResumo'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { importarLinhas, type ResultadoImportacao } from '@/hooks/useImportacao'
import { lerImportacao, MODELOS, type ResultadoLeitura, type TipoImportacao, type LinhaApolice, type LinhaCliente } from '@/lib/importacao'
import { descarregarCsv } from '@/lib/descarregar'
import { mensagemErro } from '@/lib/erros'

type Leitura = ResultadoLeitura<LinhaCliente | LinhaApolice>
const TIPOS: { valor: TipoImportacao; rotulo: string }[] = [{ valor: 'clientes', rotulo: 'Clientes' }, { valor: 'apolices', rotulo: 'Apólices' }]

export default function Importar() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [tipo, setTipo] = useState<TipoImportacao>('clientes')
  const [ficheiro, setFicheiro] = useState<string | null>(null)
  const [leitura, setLeitura] = useState<Leitura | null>(null)
  const [aImportar, setAImportar] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const input = useRef<HTMLInputElement>(null)

  // O próprio import já é protegido na base de dados; isto só evita mostrar a página.
  if (!isAdmin) return <Navigate to="/" replace />

  const recomecar = () => {
    setFicheiro(null); setLeitura(null); setResultado(null); setProgresso(0)
    if (input.current) input.current.value = ''
  }

  const handleFicheiro = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/\.csv$/i.test(f.name)) {
      toast({ title: 'Ficheiro não suportado', description: 'Guarde a folha como CSV (no Excel: Guardar como → CSV UTF-8) e escolha-a de novo.', variant: 'destructive' })
      e.target.value = ''
      return
    }
    setFicheiro(f.name)
    setResultado(null)
    setLeitura(tipo === 'clientes' ? lerImportacao('clientes', await f.text()) : lerImportacao('apolices', await f.text()))
  }

  const handleImportar = async () => {
    if (!leitura) return
    setAImportar(true)
    try {
      setResultado(await importarLinhas(tipo, leitura.validas, setProgresso))
    } catch (err: unknown) {
      toast({ title: 'A importação parou', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAImportar(false)
    }
  }

  const relatorio = (erros: { linha: number; mensagem: string }[]) =>
    descarregarCsv(`erros-importacao-${tipo}.csv`, [['linha', 'problema'], ...erros.map((e) => [String(e.linha), e.mensagem])])

  const cabecalho = MODELOS[tipo].cabecalho

  return (
    <div className="space-y-6">
      <PageHeader title="Importar carteira"
        description="Traga clientes e apólices de uma folha de cálculo. Importe primeiro os clientes: as apólices ligam-se a eles pelo NIF." />

      <section className="panel form-panel space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="O que importar" className="segmented">
            {TIPOS.map((t) => (
              <button key={t.valor} type="button" aria-pressed={tipo === t.valor} disabled={aImportar}
                onClick={() => { setTipo(t.valor); recomecar() }}>{t.rotulo}</button>
            ))}
          </div>
          <Button variant="secondary" icon={<Download />}
            onClick={() => descarregarCsv(`modelo-${tipo}.csv`, [MODELOS[tipo].cabecalho, MODELOS[tipo].exemplo])}>
            Descarregar modelo
          </Button>
        </div>

        <Notice icon={Info}>
          Colunas: <strong className="font-medium">{cabecalho.join(', ')}</strong>.{' '}
          {tipo === 'clientes'
            ? 'O NIF é validado pelo dígito de controlo e não se repetem clientes com o mesmo NIF. Sem responsável indicado, o cliente fica consigo.'
            : 'Datas em dd/mm/aaaa, valores como 1.234,56, ramo e estado pelo nome (ex.: Automóvel, Ativa). Apólices com número já existente não são duplicadas.'}
        </Notice>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={input} id="ficheiro-csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFicheiro} disabled={aImportar} />
          <label htmlFor="ficheiro-csv" className="button inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark">
            <FileUp size={16} aria-hidden="true" />{ficheiro ? 'Escolher outro ficheiro' : 'Escolher ficheiro CSV'}
          </label>
          {ficheiro && <span className="text-sm text-muted">{ficheiro}</span>}
        </div>
      </section>

      {leitura && !resultado && (
        <>
          <Contagens itens={[
            { rotulo: 'Linhas no ficheiro', valor: leitura.total },
            { rotulo: 'Prontas a importar', valor: leitura.validas.length, tom: 'success' },
            { rotulo: 'Com problemas', valor: leitura.erros.length, tom: 'danger' },
          ]} />
          <ListaErros erros={leitura.erros} titulo="Estas linhas não vão ser importadas:" onDescarregar={() => relatorio(leitura.erros)} />

          {leitura.validas.length > 0 && (
            <div className="table-panel">
              <div className="data-panel-heading">Pré-visualização<span>primeiras {Math.min(5, leitura.validas.length)} de {leitura.validas.length}</span></div>
              <div role="region" aria-label="Pré-visualização" tabIndex={0} className="overflow-x-auto scroll-thin">
                <table className="crm-table w-full text-sm">
                  <thead className="text-left text-muted">
                    <tr><th className="font-semibold uppercase">Linha</th>{cabecalho.map((c) => <th key={c} className="whitespace-nowrap font-semibold uppercase">{c.replace(/_/g, ' ')}</th>)}</tr>
                  </thead>
                  <tbody>
                    {leitura.validas.slice(0, 5).map((v) => (
                      <tr key={v.linha} className="border-t border-border">
                        <td className="tabular-nums">{v.linha}</td>
                        {cabecalho.map((c) => <td key={c} className="whitespace-nowrap">{String((v.dados as unknown as Record<string, unknown>)[c] ?? '—')}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {aImportar && <span className="text-sm text-muted tabular-nums">{progresso} de {leitura.validas.length}…</span>}
            <Button variant="secondary" icon={<RotateCcw />} disabled={aImportar} onClick={recomecar}>Cancelar</Button>
            <Button icon={<Upload />} loading={aImportar} disabled={leitura.validas.length === 0} onClick={handleImportar}>
              Importar {leitura.validas.length} {leitura.validas.length === 1 ? 'linha' : 'linhas'}
            </Button>
          </div>
        </>
      )}

      {resultado && leitura && (
        <>
          <Contagens itens={[
            { rotulo: tipo === 'clientes' ? 'Clientes criados' : 'Apólices criadas', valor: resultado.inseridos, tom: 'success' },
            { rotulo: 'Não importadas', valor: leitura.erros.length + resultado.ignorados.length, tom: 'danger' },
          ]} />
          <ListaErros erros={[...leitura.erros, ...resultado.ignorados].sort((a, b) => a.linha - b.linha)}
            titulo="Linhas não importadas:" onDescarregar={() => relatorio([...leitura.erros, ...resultado.ignorados].sort((a, b) => a.linha - b.linha))} />
          <div className="flex justify-end">
            <Button icon={<RotateCcw />} onClick={recomecar}>Nova importação</Button>
          </div>
        </>
      )}
    </div>
  )
}
