import type { Pergunta } from "../../data/apoio";
import PorConfirmar from "./PorConfirmar";

/**
 * Perguntas frequentes em acordeão, sobre <details>/<summary> nativos:
 * teclado (Enter/Espaço) e leitores de ecrã funcionam sem JS próprio.
 */
export default function Accordion({ itens }: { itens: Pergunta[] }) {
  return (
    <div className="faq">
      {itens.map((p) => (
        <details key={p.pergunta} className="faq__item">
          <summary className="faq__question">{p.pergunta}</summary>
          <p className="faq__answer text-secondary">
            {p.porConfirmar ? <PorConfirmar>{p.resposta}</PorConfirmar> : p.resposta}
          </p>
        </details>
      ))}
    </div>
  );
}
