import { useRef, useState, type ChangeEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Download, FileUp, Info, RotateCcw, Sparkles, Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Contagens, ListaErros, PreVisualizacao } from '@/components/crm/ImportacaoResumo'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { importarLinhas, lerComIA, type ResultadoImportacao } from '@/hooks/useImportacao'
import { lerImportacao, MODELOS, type ResultadoLeitura, type TipoImportacao, type LinhaApolice, type LinhaCliente } from '@/lib/importacao'
import { escreverCsv } from '@/lib/csv'
import { descarregarCsv } from '@/lib/descarregar'
import { mensagemErro } from '@/lib/erros'

type Leitura = ResultadoLeitura<LinhaCliente | LinhaApolice>
const TIPOS: { valor: TipoImportacao; rotulo: string }[] = [{ valor: 'clientes', rotulo: 'Clientes' }, { valor: 'apolices', rotulo: 'Apólices' }]
const ACEITES = '.csv,.txt,.pdf,.png,.jpg,.jpeg,.webp,text/csv,text/plain,application/pdf,image/png,image/jpeg,image/webp'
const SO_IA = /\.(pdf|png|jpe?g|webp|txt)$/i

const ler = (tipo: TipoImportacao, csv: string): Leitura => (tipo === 'clientes' ? lerImportacao('clientes', csv) : lerImportacao('apolices', csv))

export default function Importar() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [tipo, setTipo] = useState<TipoImportacao>('clientes')
  const [ficheiro, setFicheiro] = useState<File | null>(null)
  const [leitura, setLeitura] = useState<Leitura | null>(null)
  const [lidoPorIA, setLidoPorIA] = useState(false)
  const [aLerIA, setALerIA] = useState(false)
  const [aImportar, setAImportar] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const input = useRef<HTMLInputElement>(null)

  // O próprio import já é protegido na base de dados; isto só evita mostrar a página.
  if (!isAdmin) return <Navigate to="/" replace />

  const recomecar = () => {
    setFicheiro(null); setLeitura(null); setResultado(null); setProgresso(0); setLidoPorIA(false)
    if (input.current) input.current.value = ''
  }

  const handleLerComIA = async (f: File) => {
    setALerIA(true)
    try {
      setLeitura(ler(tipo, escreverCsv(await lerComIA(tipo, f))))
      setLidoPorIA(true)
    } catch (err: unknown) {
      toast({ title: 'Não foi possível ler com IA', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setALerIA(false)
    }
  }

  const handleFicheiro = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/\.csv$/i.test(f.name) && !SO_IA.test(f.name)) {
      toast({ title: 'Ficheiro não suportado', description: 'Use CSV, PDF, imagem (PNG, JPG, WEBP) ou texto. Uma folha do Excel pode ser guardada como CSV UTF-8.', variant: 'destructive' })
      e.target.value = ''
      return
    }
    setFicheiro(f); setResultado(null); setLidoPorIA(false); setLeitura(null)
    // CSV no modelo lê-se aqui, sem IA; PDF, imagem e texto só a IA consegue ler.
    if (SO_IA.test(f.name)) await handleLerComIA(f)
    else setLeitura(ler(tipo, await f.text()))
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
  const ocupado = aImportar || aLerIA
  // CSV que não segue o modelo (colunas em falta): a IA pode mapear as colunas.
  const csvForaDoModelo = !!leitura && !lidoPorIA && leitura.total > 0 && leitura.validas.length === 0 && leitura.erros[0]?.linha === 1

  return (
    <div className="space-y-6">
      <PageHeader title="Importar carteira"
        description="Traga clientes e apólices de uma folha de cálculo, PDF ou imagem. Importe primeiro os clientes: as apólices ligam-se a eles pelo NIF." />

      <section className="panel form-panel space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="O que importar" className="segmented">
            {TIPOS.map((t) => (
              <button key={t.valor} type="button" aria-pressed={tipo === t.valor} disabled={ocupado}
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
          {' '}Um CSV no modelo é lido diretamente. PDF, imagem, texto ou um CSV com outras colunas são lidos com IA (até 3 MB).
        </Notice>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={input} id="ficheiro-carteira" type="file" accept={ACEITES} className="sr-only" onChange={handleFicheiro} disabled={ocupado} />
          <label htmlFor="ficheiro-carteira" aria-disabled={ocupado || undefined}
            className={`button inline-flex min-h-10 items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark ${ocupado ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
            <FileUp size={16} aria-hidden="true" />{ficheiro ? 'Escolher outro ficheiro' : 'Escolher ficheiro'}
          </label>
          {ficheiro && <span className="text-sm text-muted">{ficheiro.name}</span>}
          {aLerIA && <span role="status" className="text-sm text-muted">A ler o documento com IA, pode demorar até um minuto…</span>}
        </div>
      </section>

      {leitura && !resultado && (
        <>
          {csvForaDoModelo && ficheiro && (
            <Notice tone="info" icon={Sparkles}
              action={<Button size="sm" icon={<Sparkles />} loading={aLerIA} onClick={() => handleLerComIA(ficheiro)}>Ler com IA</Button>}>
              Este CSV não tem as colunas do modelo. A IA pode identificar as colunas e ler os dados por si.
            </Notice>
          )}
          {lidoPorIA && (
            <Notice tone="info" icon={Sparkles}>
              Dados lidos com IA. Confira a pré-visualização com o documento original antes de importar: a validação do NIF, datas e valores foi feita na mesma, mas um nome ou número mal lido pode passar.
            </Notice>
          )}
          <Contagens itens={[
            { rotulo: lidoPorIA ? 'Registos encontrados' : 'Linhas no ficheiro', valor: leitura.total },
            { rotulo: 'Prontas a importar', valor: leitura.validas.length, tom: 'success' },
            { rotulo: 'Com problemas', valor: leitura.erros.length, tom: 'danger' },
          ]} />
          <ListaErros erros={leitura.erros} titulo="Estas linhas não vão ser importadas:" onDescarregar={() => relatorio(leitura.erros)} />
          <PreVisualizacao validas={leitura.validas} cabecalho={cabecalho} maximo={lidoPorIA ? 100 : 5} />

          <div className="flex flex-wrap items-center justify-end gap-3">
            {aImportar && <span className="text-sm text-muted tabular-nums">{progresso} de {leitura.validas.length}…</span>}
            <Button variant="secondary" icon={<RotateCcw />} disabled={ocupado} onClick={recomecar}>Cancelar</Button>
            <Button icon={<Upload />} loading={aImportar} disabled={leitura.validas.length === 0 || aLerIA} onClick={handleImportar}>
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
