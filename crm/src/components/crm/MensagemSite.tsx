import { Copy } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { copiavel, lerMensagemSite } from '@/lib/mensagemSite'

interface MensagemSiteProps {
  texto: string
}

/** O pedido feito no site, por blocos: o mediador vê o essencial em cima e copia matrícula ou NIF. */
export function MensagemSite({ texto }: MensagemSiteProps) {
  const { toast } = useToast()
  const { resumo, blocos, livre } = lerMensagemSite(texto)

  const copiar = async (rotulo: string, valor: string) => {
    try {
      await navigator.clipboard.writeText(valor)
      toast({ title: `${rotulo} copiado` })
    } catch (err: unknown) {
      console.error(err)
      toast({ title: 'Não foi possível copiar', description: 'Selecione o texto e copie à mão.', variant: 'destructive' })
    }
  }

  return (
    <section className="mensagem-site" aria-label="Pedido feito no site">
      <p className="mensagem-site__origem">Pedido feito no site</p>
      {resumo && <p className="mensagem-site__resumo">{resumo}</p>}
      {blocos.map((bloco) => (
        <div key={bloco.titulo}>
          <h3 className="mensagem-site__titulo">{bloco.titulo}</h3>
          <dl className="mensagem-site__lista">
            {bloco.linhas.map((linha) => (
              <div key={`${linha.rotulo}-${linha.valor}`} className="contents">
                <dt>{linha.rotulo}</dt>
                <dd>
                  <span className="min-w-0">{linha.valor}</span>
                  {copiavel(linha) && (
                    <button type="button" className="mensagem-site__copiar" onClick={() => void copiar(linha.rotulo, linha.valor)}
                      aria-label={`Copiar ${linha.rotulo.toLowerCase()}`} title={`Copiar ${linha.rotulo.toLowerCase()}`}>
                      <Copy size={13} aria-hidden="true" />
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      {livre && (
        <div>
          <h3 className="mensagem-site__titulo">Mensagem</h3>
          <p className="mensagem-site__livre">{livre}</p>
        </div>
      )}
    </section>
  )
}
