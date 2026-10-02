import type { Bloco } from "../../utils/montarMensagem";

export type ResumoPedidoProps = {
  blocos: (Bloco & { indice: number })[];
  /** Volta ao passo do bloco, sem perder nada do que foi escrito. */
  aoAlterar: (indice: number) => void;
};

/** O passo "Rever e enviar": tudo o que vai seguir, por blocos, com "Alterar" em cada um. */
export default function ResumoPedido({ blocos, aoAlterar }: ResumoPedidoProps) {
  return (
    <div className="form-review">
      {blocos.map((b) => (
        <section key={b.titulo} className="form-review__block" aria-label={b.titulo}>
          <div className="form-review__head">
            <h3 className="form-review__title">{b.titulo}</h3>
            <button type="button" className="form-review__edit" onClick={() => aoAlterar(b.indice)}>
              Alterar<span className="visually-hidden"> {b.titulo.toLowerCase()}</span>
            </button>
          </div>
          <dl className="form-review__list">
            {b.linhas.map((l) => (
              <div key={l.rotulo} className="form-review__row">
                <dt>{l.rotulo}</dt>
                <dd>{l.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
