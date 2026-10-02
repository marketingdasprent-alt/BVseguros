import { useEffect, useId, useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import { SEM_MATRICULA } from "../../data/formularios";
import { formatarMatricula, limparMatricula, repartirMatricula, validarMatricula } from "../../utils/validacoes";

type Partes = [string, string, string];

export type CampoMatriculaProps = {
  /** `name` do campo escondido que leva o valor ("AA-00-AA" ou "Ainda não tem"). */
  name: string;
  label: string;
  required?: boolean;
  permitirSemMatricula?: boolean;
  /** Em destaque: chapa grande e ao centro, como o primeiro ecrã do simulador da Fidelidade. */
  grande?: boolean;
  aoMudar?: () => void;
};

const PARES = ["1.º par", "2.º par", "3.º par"];

/**
 * Matrícula como na Fidelidade: três caixas de 2 caracteres numa chapa, 6
 * no máximo. Ao contrário da Fidelidade, colar a matrícula inteira (em
 * qualquer caixa, com ou sem hífenes) reparte-a pelas três a partir da
 * primeira. As caixas não têm maxLength: o corte é feito aqui, para o
 * preenchimento automático que escreve tudo de uma vez também repartir.
 */
export default function CampoMatricula({ name, label, required, permitirSemMatricula, grande, aoMudar }: CampoMatriculaProps) {
  const [partes, setPartes] = useState<Partes>(["", "", ""]);
  const [semMatricula, setSemMatricula] = useState(false);
  const [sobra, setSobra] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const caixas = useRef<(HTMLInputElement | null)[]>([]);
  const idErro = useId();
  const idAjuda = useId();

  const junto = partes.join("");
  const valor = semMatricula ? SEM_MATRICULA : junto.length === 6 ? formatarMatricula(junto) : junto;
  const erro = semMatricula
    ? null
    : sobra
      ? "A matrícula tem 6 caracteres. Confirme o que colou."
      : junto === ""
        ? required
          ? 'Indique a matrícula, ou carregue em "Ainda não tenho matrícula".'
          : null
        : junto.length < 6
          ? "A matrícula tem 6 caracteres."
          : validarMatricula(junto);
  const comErro = mostrar && erro !== null;

  // O erro fica na 1.ª caixa: é ela que o formulário foca ao não deixar avançar.
  useEffect(() => {
    caixas.current[0]?.setCustomValidity(erro ?? "");
    aoMudar?.();
  }, [erro, valor, aoMudar]);

  const preencher = (texto: string) => {
    const r = repartirMatricula(texto);
    setPartes(r.partes);
    setSobra(r.sobra);
    const ultima = r.partes[2] ? 2 : r.partes[1] ? 1 : 0;
    caixas.current[ultima]?.focus();
    if (r.partes.join("").length === 6 || r.sobra) setMostrar(true);
  };

  const escrever = (i: number, texto: string) => {
    const limpo = limparMatricula(texto);
    // Mais de 2 caracteres de uma vez numa caixa: preenchimento automático, reparte como o colar.
    if (limpo.length > 2) {
      preencher(limpo);
      return;
    }
    const novas: Partes = [...partes];
    novas[i] = limpo;
    setPartes(novas);
    setSobra(false);
    if (limpo.length === 2 && i < 2) caixas.current[i + 1]?.focus();
  };

  const colar = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    preencher(e.clipboardData.getData("text"));
  };

  const tecla = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && partes[i] === "" && i > 0) {
      e.preventDefault();
      caixas.current[i - 1]?.focus();
    }
  };

  const alternar = () => {
    setSemMatricula((s) => !s);
    setMostrar(false);
    setSobra(false);
  };

  return (
    <fieldset
      className={`plate-field form-grid__full${grande ? " plate-field--grande" : ""}`}
      aria-describedby={comErro ? idErro : undefined}
      onBlur={(e) => {
        // Só mostra o erro ao sair da chapa toda, não ao saltar de caixa em caixa.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && junto !== "") setMostrar(true);
      }}
    >
      <legend className="field__label">{label}</legend>
      <div className={`plate${semMatricula ? " plate--off" : ""}${comErro ? " plate--error" : ""}`}>
        <span className="plate__country" aria-hidden="true">
          P
        </span>
        {partes.map((parte, i) => (
          <span key={i} className="plate__part">
            {i > 0 && (
              <span className="plate__dot" aria-hidden="true">
                ·
              </span>
            )}
            <input
              ref={(el) => {
                caixas.current[i] = el;
              }}
              className="plate__box"
              type="text"
              value={parte}
              placeholder="XX"
              aria-label={`${label}, ${PARES[i]}`}
              aria-invalid={comErro || undefined}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              disabled={semMatricula}
              onChange={(e) => escrever(i, e.currentTarget.value)}
              onPaste={colar}
              onKeyDown={(e) => tecla(i, e)}
              onInvalid={() => setMostrar(true)}
            />
          </span>
        ))}
      </div>
      <input type="hidden" name={name} value={valor} />
      {comErro && (
        <span id={idErro} className="field__message plate-field__error">
          {erro}
        </span>
      )}
      {permitirSemMatricula && (
        <button type="button" className="plate-field__toggle" aria-pressed={semMatricula} aria-describedby={idAjuda} onClick={alternar}>
          {semMatricula ? "Tenho matrícula" : "Ainda não tenho matrícula"}
        </button>
      )}
      <span id={idAjuda} className="visually-hidden">
        {semMatricula ? "Sem matrícula: indique a marca e o modelo do carro." : "Carro novo ou importado ainda sem matrícula portuguesa."}
      </span>
    </fieldset>
  );
}
