import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Info, RotateCcw, Sparkles, Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Contagens, ListaErros, PreVisualizacao } from '@/components/crm/ImportacaoResumo'
import { ImportarTipo } from '@/components/crm/ImportarTipo'
import { ImportarFicheiro } from '@/components/crm/ImportarFicheiro'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { importarLinhas, lerComIA, type ResultadoImportacao } from '@/hooks/useImportacao'
import { lerImportacao, MODELOS, type ResultadoLeitura, type TipoImportacao, type LinhaApolice, type LinhaCliente } from '@/lib/importacao'
import { descarregarModelo, descarregarRelatorio, formatoDe, lerFicheiro } from '@/lib/ficheiroImportacao'
import { mensagemErro } from '@/lib/erros'

type Leitura = ResultadoLeitura<LinhaCliente | LinhaApolice>
const ROTULO_TIPO: Record<TipoImportacao, string> = { clientes: 'clientes', apolices: 'apólices' }
// Leitura com IA desligada (posta de lado a 01/10/2026). O código fica: voltar a true reativa imagem e texto.
// O PDF já não precisa dela: o do modelo lê-se aqui (lib/tabelaPdf.ts).
const IA_ATIVA = false
const SO_IA = /\.(png|jpe?g|webp|txt)$/i

const ler = (tipo: TipoImportacao, tabela: string[][]): Leitura => (tipo === 'clientes' ? lerImportacao('clientes', tabela) : lerImportacao('apolices', tabela))

export default function Importar() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [tipo, setTipo] = useState<TipoImportacao | null>(null)
  const [ficheiro, setFicheiro] = useState<File | null>(null)
  const [leitura, setLeitura] = useState<Leitura | null>(null)
  const [lidoPorIA, setLidoPorIA] = useState(false)
  const [aLer, setALer] = useState(false)
  const [aImportar, setAImportar] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)

  // O próprio import já é protegido na base de dados; isto só evita mostrar a página.
  if (!isAdmin) return <Navigate to="/" replace />

  const recomecar = () => {
    setFicheiro(null); setLeitura(null); setResultado(null); setProgresso(0); setLidoPorIA(false)
  }

  const handleFicheiro = async (f: File) => {
    if (!tipo) return
    const viaIA = IA_ATIVA && SO_IA.test(f.name)
    if (!formatoDe(f.name) && !viaIA) {
      toast({ title: 'Ficheiro não suportado', description: 'Use o modelo em Excel (.xlsx), um CSV ou um PDF gerado a partir do modelo.', variant: 'destructive' })
      return
    }
    recomecar()
    setFicheiro(f)
    setALer(true)
    try {
      setLeitura(ler(tipo, viaIA ? await lerComIA(tipo, f) : await lerFicheiro(f, tipo)))
      setLidoPorIA(viaIA)
    } catch (err: unknown) {
      setFicheiro(null)
      toast({ title: 'Não foi possível ler o ficheiro', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setALer(false)
    }
  }

  const handleImportar = async () => {
    if (!leitura || !tipo) return
    setAImportar(true)
    try {
      setResultado(await importarLinhas(tipo, leitura.validas, setProgresso))
    } catch (err: unknown) {
      toast({ title: 'A importação parou', description: mensagemErro(err), variant: 'destructive' })
    } finally {
      setAImportar(false)
    }
  }

  const descarregar = (acao: () => Promise<void>) => () => {
    acao().catch((err: unknown) => toast({ title: 'Não foi possível criar o ficheiro', description: mensagemErro(err), variant: 'destructive' }))
  }

  const ocupado = aImportar || aLer
  const modelo = tipo ? MODELOS[tipo] : null
  // Ficheiro sem as colunas do modelo: o único erro é o da linha 1.
  const foraDoModelo = !!leitura && !lidoPorIA && leitura.total > 0 && leitura.validas.length === 0 && leitura.erros[0]?.linha === 1
  const naoImportadas = resultado && leitura ? [...leitura.erros, ...resultado.ignorados].sort((a, b) => a.linha - b.linha) : []

  return (
    <div className="space-y-6">
      <PageHeader title="Importar carteira"
        description="Traga os clientes e as apólices que já tem, a partir do modelo em Excel. Importe primeiro os clientes: as apólices ligam-se a eles pelo NIF." />

      <section className="panel form-panel">
        <ImportarTipo valor={tipo} disabled={ocupado} onChange={(v) => { setTipo(v); recomecar() }} />
      </section>

      {tipo && modelo && (
        <section className="panel form-panel space-y-4">
          <ImportarFicheiro rotuloTipo={ROTULO_TIPO[tipo]} ficheiro={ficheiro} aLer={aLer} disabled={aImportar}
            onFicheiro={handleFicheiro} onDescarregarModelo={descarregar(() => descarregarModelo(tipo))} />
          <Notice icon={Info}>
            Colunas do modelo: <strong className="font-medium">{modelo.rotulos.join(', ')}</strong>.{' '}
            {tipo === 'clientes'
              ? 'O NIF é validado pelo dígito de controlo e não se repetem clientes com o mesmo NIF. Sem responsável indicado, o cliente fica consigo.'
              : 'Datas em dd/mm/aaaa, prémio como 1.234,56, ramo e estado pelo nome (ex.: Automóvel, Ativa). Apólices com número já existente não são duplicadas.'}
          </Notice>
        </section>
      )}

      {tipo && modelo && leitura && !resultado && (
        <section className="space-y-4" aria-labelledby="passo-confirmar">
          <h2 id="passo-confirmar" className="import-step-title"><span className="import-step-number">3</span>Confirme e importe</h2>
          {foraDoModelo && (
            <Notice tone="info" icon={Info}>
              Este ficheiro não tem as colunas do modelo. Descarregue o modelo em Excel, copie os dados para as colunas certas e carregue-o de novo.
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
          <ListaErros erros={leitura.erros} titulo="Estas linhas não vão ser importadas:" onDescarregar={descarregar(() => descarregarRelatorio(tipo, leitura.erros))} />
          <PreVisualizacao validas={leitura.validas} cabecalho={modelo.cabecalho} rotulos={modelo.rotulos} maximo={lidoPorIA ? 100 : 5} />

          <div className="flex flex-wrap items-center justify-end gap-3">
            {aImportar && <span className="text-sm text-muted tabular-nums">{progresso} de {leitura.validas.length}…</span>}
            <Button variant="secondary" icon={<RotateCcw />} disabled={ocupado} onClick={recomecar}>Recomeçar</Button>
            <Button icon={<Upload />} loading={aImportar} disabled={leitura.validas.length === 0 || aLer} onClick={handleImportar}>
              Importar {leitura.validas.length} {leitura.validas.length === 1 ? 'linha' : 'linhas'}
            </Button>
          </div>
        </section>
      )}

      {tipo && resultado && leitura && (
        <section className="space-y-4">
          <Contagens itens={[
            { rotulo: tipo === 'clientes' ? 'Clientes criados' : 'Apólices criadas', valor: resultado.inseridos, tom: 'success' },
            { rotulo: 'Não importadas', valor: naoImportadas.length, tom: 'danger' },
          ]} />
          <ListaErros erros={naoImportadas} titulo="Linhas não importadas:" onDescarregar={descarregar(() => descarregarRelatorio(tipo, naoImportadas))} />
          <div className="flex justify-end">
            <Button icon={<RotateCcw />} onClick={recomecar}>Nova importação</Button>
          </div>
        </section>
      )}
    </div>
  )
}
