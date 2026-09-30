import Input from "./Input";
import type { Campo } from "../../data/formularios";

/** Prefixo nos `name` para nunca colidir com os campos base (nome, email, o honeypot "empresa"). */
export const PREFIXO_CAMPO = "d_";

function CampoRamo({ campo }: { campo: Campo }) {
  const name = PREFIXO_CAMPO + campo.nome;
  const id = `campo-${campo.nome}`;
  const classe = campo.largura === "meia" ? "form-grid__half" : "form-grid__full";

  if (campo.tipo === "radio" && campo.opcoes) {
    return (
      <fieldset className={`choice-group ${classe}`}>
        <legend className="field__label">{campo.rotulo}</legend>
        <div className="choice-group__options">
          {campo.opcoes.map((opcao) => (
            <label key={opcao} className="choice">
              <input type="radio" name={name} value={opcao} required={campo.obrigatorio} />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (campo.tipo === "select" && campo.opcoes) {
    return (
      <div className={`field ${classe}`}>
        <label className="field__label" htmlFor={id}>
          {campo.rotulo}
        </label>
        <select id={id} name={name} className="field__control" required={campo.obrigatorio} defaultValue="">
          <option value="">Escolha uma opção</option>
          {campo.opcoes.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (campo.tipo === "textarea") {
    return (
      <div className={`field ${classe}`}>
        <label className="field__label" htmlFor={id}>
          {campo.rotulo}
        </label>
        <textarea
          id={id}
          name={name}
          rows={4}
          maxLength={campo.maxLength}
          required={campo.obrigatorio}
          className="field__control"
        />
      </div>
    );
  }

  return (
    <Input
      id={id}
      className={classe}
      label={campo.rotulo}
      name={name}
      type={campo.tipo === "numero" ? "number" : campo.tipo === "data" ? "date" : "text"}
      inputMode={campo.inputMode}
      min={campo.min}
      max={campo.max}
      maxLength={campo.maxLength}
      placeholder={campo.placeholder}
      autoComplete={campo.autoComplete ?? "off"}
      required={campo.obrigatorio}
    />
  );
}

export default function CamposRamo({ campos }: { campos: Campo[] }) {
  return (
    <div className="form-grid">
      {campos.map((campo) => (
        <CampoRamo key={campo.nome} campo={campo} />
      ))}
    </div>
  );
}
