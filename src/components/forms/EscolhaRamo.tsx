import { useId, useState } from "react";
import CardGrid from "../layout/CardGrid";
import RamoIcon from "../ui/RamoIcon";
import { SEGUROS } from "../../data/seguros";
import type { RamoCrm } from "../../utils/enviarContacto";

export type EscolhaRamoProps = {
  ramos: { valor: RamoCrm; nome: string }[];
  valor: RamoCrm | "";
  onChange: (valor: RamoCrm) => void;
  /** Escolha com o rato ou o toque: avança logo. Com as setas só escolhe (avança com Enter ou "Próximo"). */
  onEscolhido: () => void;
};

/**
 * Primeiro passo do pedido genérico: o tipo de seguro em cartões grandes,
 * como a primeira escolha dos simuladores da Multicare.
 */
export default function EscolhaRamo({ ramos, valor, onChange, onEscolhido }: EscolhaRamoProps) {
  const [comErro, setComErro] = useState(false);
  const idErro = useId();
  return (
    <fieldset
      className="choice-group"
      aria-describedby={comErro ? idErro : undefined}
      onInvalidCapture={() => setComErro(true)}
    >
      <legend className="visually-hidden">Tipo de seguro</legend>
      <CardGrid cols={3} colsTablet={2} className="option-cards option-cards--ramos">
        {ramos.map((ramo) => {
          const seguro = SEGUROS.find((s) => s.ramoCrm === ramo.valor);
          return (
            <label key={ramo.valor} className="option-card option-card--ramo">
              <input
                type="radio"
                name="tipo_seguro"
                value={ramo.valor}
                required
                checked={valor === ramo.valor}
                onChange={() => {
                  setComErro(false);
                  onChange(ramo.valor);
                }}
                // detail 0: clique gerado pelas setas do teclado, que só mudam a escolha.
                onClick={(e) => {
                  if (e.detail > 0) onEscolhido();
                }}
              />
              <span className="option-card__body">
                {seguro && (
                  <span className="option-card__icon">
                    <RamoIcon tipo={seguro.key} />
                  </span>
                )}
                <span className="option-card__title">{ramo.nome}</span>
                {seguro && <span className="option-card__text">{seguro.descricao}</span>}
              </span>
            </label>
          );
        })}
      </CardGrid>
      {comErro && (
        <span id={idErro} className="field__message field__message--error">
          Escolha o tipo de seguro.
        </span>
      )}
    </fieldset>
  );
}
