import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { resolverCodigoPostal, sugerirMoradas } from "../../utils/moradas";
import type { SugestaoMorada } from "../../utils/moradas";

export type CampoMoradaProps = {
  /** `name` do campo escondido que leva a morada completa (rua e número). */
  name: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
  /** Chamado com o código postal exato quando se sabe (sugestão ou número de porta). */
  aoEscolherCodigo: (cp7: string) => void;
};

const ESPERA_MS = 250;

/**
 * Morada com sugestões da moradas.dev (padrão combobox: setas, Enter,
 * Escape). Escolher uma rua preenche o código postal; se a rua tiver
 * vários, o número de porta decide. Sem resposta da API não há lista e a
 * pessoa escreve a morada à mão, como num campo normal.
 */
export default function CampoMorada({ name, label, placeholder, maxLength, aoEscolherCodigo }: CampoMoradaProps) {
  const [texto, setTexto] = useState("");
  const [numero, setNumero] = useState("");
  const [sugestoes, setSugestoes] = useState<SugestaoMorada[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [aviso, setAviso] = useState<string | null>(null);
  // art_id da rua escolhida com vários códigos postais: só serve para o /resolve a seguir.
  const [ruaPorResolver, setRuaPorResolver] = useState<number | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pedido = useRef<AbortController | null>(null);
  const id = useId();
  const idLista = `${id}-lista`;
  const idAviso = `${id}-aviso`;

  useEffect(
    () => () => {
      clearTimeout(temporizador.current);
      pedido.current?.abort();
    },
    []
  );

  const procurar = (q: string) => {
    clearTimeout(temporizador.current);
    pedido.current?.abort();
    if (q.trim().length < 3) {
      setSugestoes([]);
      setAberto(false);
      return;
    }
    temporizador.current = setTimeout(() => {
      const controlo = new AbortController();
      pedido.current = controlo;
      sugerirMoradas(q, controlo.signal)
        .then((lista) => {
          setSugestoes(lista);
          setAberto(lista.length > 0);
          setAtivo(-1);
        })
        .catch(() => {
          // Cancelado: veio uma tecla nova, que faz o seu próprio pedido.
        });
    }, ESPERA_MS);
  };

  const escolher = (s: SugestaoMorada) => {
    setTexto(s.texto);
    setAberto(false);
    setAtivo(-1);
    if (s.tipo === "loc") {
      setAviso("Continue a escrever: falta a rua.");
      setRuaPorResolver(null);
    } else if (s.cp7) {
      setAviso(null);
      setRuaPorResolver(null);
      aoEscolherCodigo(s.cp7);
    } else {
      setAviso("Esta rua tem vários códigos postais: indique o número de porta.");
      setRuaPorResolver(s.artId);
    }
  };

  const resolverPorNumero = () => {
    if (ruaPorResolver === null || !numero.trim()) return;
    resolverCodigoPostal(ruaPorResolver, numero).then((cp7) => {
      if (!cp7) return;
      setAviso(null);
      setRuaPorResolver(null);
      aoEscolherCodigo(cp7);
    });
  };

  const tecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!aberto || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((a) => (a + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((a) => (a <= 0 ? sugestoes.length - 1 : a - 1));
    } else if (e.key === "Enter" && ativo >= 0) {
      e.preventDefault();
      escolher(sugestoes[ativo]);
    } else if (e.key === "Escape") {
      // Fecha só a lista: o Escape não deve fazer mais nada na página.
      e.preventDefault();
      e.stopPropagation();
      setAberto(false);
    }
  };

  const completa = [texto.trim(), numero.trim() && `nº ${numero.trim()}`].filter(Boolean).join(", ");

  return (
    <div className="address-field form-grid__full">
      <div className="address-field__row">
        <div className="field address-field__street">
          <label className="field__label" htmlFor={`${id}-rua`}>
            {label} (opcional)
          </label>
          <input
            id={`${id}-rua`}
            className="field__control"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={aberto}
            aria-controls={idLista}
            aria-activedescendant={aberto && ativo >= 0 ? `${id}-op-${ativo}` : undefined}
            aria-describedby={aviso ? idAviso : undefined}
            autoComplete="street-address"
            placeholder={placeholder}
            maxLength={maxLength}
            value={texto}
            onChange={(e) => {
              setTexto(e.currentTarget.value);
              setAviso(null);
              setRuaPorResolver(null);
              procurar(e.currentTarget.value);
            }}
            onKeyDown={tecla}
            onBlur={() => setAberto(false)}
          />
          <ul id={idLista} role="listbox" className="address-field__list" hidden={!aberto} aria-label="Sugestões de morada">
            {sugestoes.map((s, i) => (
              <li
                key={`${s.artId}-${s.texto}`}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === ativo}
                className="address-field__option"
                // mousedown, não click: o blur do campo fecharia a lista antes do clique.
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(s);
                }}
              >
                <span>{s.rua || s.localidade}</span>
                <span className="address-field__place">
                  {[s.rua ? s.localidade : "", s.concelho, s.cp7].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="field address-field__number">
          <label className="field__label" htmlFor={`${id}-numero`}>
            Nº de porta
          </label>
          <input
            id={`${id}-numero`}
            className="field__control"
            type="text"
            inputMode="numeric"
            maxLength={10}
            autoComplete="off"
            value={numero}
            onChange={(e) => setNumero(e.currentTarget.value)}
            onBlur={resolverPorNumero}
          />
        </div>
      </div>
      {aviso && (
        <span id={idAviso} className="field__message" role="status">
          {aviso}
        </span>
      )}
      <input type="hidden" name={name} value={completa} />
    </div>
  );
}
