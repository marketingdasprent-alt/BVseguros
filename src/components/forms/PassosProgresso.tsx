export type PassosProgressoProps = {
  passos: { id: string; nome: string }[];
  atual: number;
  /** Voltar a um passo já feito. Os seguintes não são clicáveis: obrigam a passar pelo "Próximo". */
  aoIr: (indice: number) => void;
};

/**
 * Barra de passos do pedido, como a dos simuladores da Fidelidade: o
 * passo atual destacado, os feitos com visto e clicáveis para voltar. Em
 * telemóvel fica só "Passo 2 de 4, Nome".
 */
export default function PassosProgresso({ passos, atual, aoIr }: PassosProgressoProps) {
  return (
    <nav className="form-steps" aria-label="Passos do pedido">
      <ol className="form-steps__list">
        {passos.map((p, i) => {
          const estado = i < atual ? "feito" : i === atual ? "atual" : "futuro";
          const conteudo = (
            <>
              <span className="form-steps__n" aria-hidden="true">
                {i < atual ? "✓" : i + 1}
              </span>
              <span className="form-steps__name">{p.nome}</span>
            </>
          );
          return (
            <li key={p.id} className={`form-steps__item form-steps__item--${estado}`}>
              {i < atual ? (
                <button type="button" className="form-steps__link" onClick={() => aoIr(i)}>
                  {conteudo}
                  <span className="visually-hidden"> (feito, voltar a este passo)</span>
                </button>
              ) : (
                <span className="form-steps__link" aria-current={i === atual ? "step" : undefined}>
                  {conteudo}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="form-steps__mobile" aria-hidden="true">
        Passo {atual + 1} de {passos.length}, {passos[atual]?.nome}
      </p>
    </nav>
  );
}
