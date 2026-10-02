import { useEffect, useRef, useState } from "react";
import InputValidado from "./InputValidado";

export type CampoPessoasProps = {
  /** `name` do campo escondido que leva as idades ("38, 36"). */
  name: string;
  label: string;
  maxPessoas: number;
  /** O primeiro cartão é quem pede ("Você"). */
  comTitular: boolean;
  aoMudar?: () => void;
};

type Pessoa = { id: number; idade: string };

const soDigitos = (v: string) => v.replace(/\D/g, "");

/**
 * Pessoas a segurar em cartões, como na Multicare: cada uma só com a
 * idade (chega para pedir propostas e é menos dado pessoal do que a data
 * de nascimento). "Acrescentar pessoa" junta um cartão; "Remover" tira-o.
 */
export default function CampoPessoas({ name, label, maxPessoas, comTitular, aoMudar }: CampoPessoasProps) {
  const [pessoas, setPessoas] = useState<Pessoa[]>([{ id: 1, idade: "" }]);
  const proximoId = useRef(2);
  const focarId = useRef<number | null>(null);
  const focarAcrescentar = useRef(false);
  const caixas = useRef(new Map<number, HTMLInputElement>());
  const botaoAcrescentar = useRef<HTMLButtonElement>(null);

  const idades = pessoas.map((p) => p.idade).filter(Boolean).join(", ");

  useEffect(() => {
    if (focarId.current !== null) {
      caixas.current.get(focarId.current)?.focus();
      focarId.current = null;
    }
    if (focarAcrescentar.current) {
      botaoAcrescentar.current?.focus();
      focarAcrescentar.current = false;
    }
    aoMudar?.();
  }, [pessoas, aoMudar]);

  const nomeDe = (i: number) => (i === 0 && comTitular ? "Você" : `Pessoa ${i + 1}`);

  const acrescentar = () => {
    const id = proximoId.current++;
    focarId.current = id;
    setPessoas((lista) => [...lista, { id, idade: "" }]);
  };

  const remover = (id: number) => {
    focarAcrescentar.current = true;
    setPessoas((lista) => lista.filter((p) => p.id !== id));
  };

  const cheio = pessoas.length >= maxPessoas;

  return (
    <fieldset className="people-field form-grid__full">
      <legend className="field__label">{label}</legend>
      <ul className="people-field__list" role="list">
        {pessoas.map((p, i) => (
          <li key={p.id} className="person-card">
            <InputValidado
              ref={(el: HTMLInputElement | null) => {
                if (el) caixas.current.set(p.id, el);
                else caixas.current.delete(p.id);
              }}
              className="person-card__field"
              label={`${nomeDe(i)} (idade)`}
              name={`pessoa-${p.id}-${name}`}
              value={p.idade}
              type="text"
              inputMode="numeric"
              maxLength={2}
              autoComplete="off"
              required
              filtrar={soDigitos}
              onChange={(e) => {
                const idade = soDigitos(e.currentTarget.value).slice(0, 2);
                setPessoas((lista) => lista.map((x) => (x.id === p.id ? { ...x, idade } : x)));
              }}
            />
            {pessoas.length > 1 && (
              <button
                type="button"
                className="person-card__remove"
                aria-label={`Remover ${nomeDe(i).toLowerCase()}`}
                onClick={() => remover(p.id)}
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
      {cheio ? (
        maxPessoas > 2 && (
          <p className="field__message">Para mais de {maxPessoas} pessoas, escolha {"\"Para a minha empresa\""}.</p>
        )
      ) : (
        <button ref={botaoAcrescentar} type="button" className="people-field__add" onClick={acrescentar}>
          + Acrescentar pessoa
        </button>
      )}
      <input type="hidden" name={name} value={idades} />
    </fieldset>
  );
}
