import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { mensagemNativa } from "./mensagemNativa";
import { PAISES, PAIS_PRINCIPAL } from "../../data/indicativos";
import type { Pais } from "../../data/indicativos";
import { formatarNacional, telefoneCompleto, validarTelefoneComIndicativo } from "../../utils/validacoes";

export type CampoTelefoneProps = {
  /** `name` do campo escondido que leva o número completo ("+351 912 345 678"). */
  name: string;
  label: string;
  required?: boolean;
  className?: string;
};

// Quem costuma pedir à BV Seguros: Portugal, a diáspora e os países de língua portuguesa.
const MAIS_USADOS = ["PT", "BR", "ES", "FR", "GB", "CH", "LU", "DE", "AO", "CV", "MZ", "US"];

const POR_CODIGO = new Map(PAISES.map((p) => [p.codigo, p]));
const PORTUGAL = POR_CODIGO.get("PT") as Pais;

const semAcentos = (v: string) => v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * "+44 20..." ou "0044 20..." (colado ou do preenchimento automático): o país
 * que o indicativo diz e o resto do número. Os indicativos E.164 não são
 * prefixo uns dos outros, por isso o primeiro que bate é o certo.
 */
function separarIndicativo(valor: string, atual: Pais): { pais: Pais; resto: string } | null {
  const m = /^\s*(?:\+|00)\s*([\d\s]*)(.*)$/.exec(valor);
  if (!m) return null;
  const digitos = m[1].replace(/\s/g, "");
  for (let n = 1; n <= Math.min(3, digitos.length); n++) {
    const indicativo = digitos.slice(0, n);
    const candidatos = PAISES.filter((p) => p.indicativo === indicativo);
    if (candidatos.length === 0) continue;
    const pais =
      candidatos.find((p) => p.codigo === atual.codigo) ??
      POR_CODIGO.get(PAIS_PRINCIPAL[indicativo] ?? "") ??
      candidatos[0];
    // Tira só os dígitos do indicativo; os espaços que vêm a seguir ficam.
    let resto = m[1] + m[2];
    for (let i = 0, vistos = 0; i < resto.length; i++) {
      if (/\d/.test(resto[i]) && ++vistos === n) {
        resto = resto.slice(i + 1).trimStart();
        break;
      }
    }
    return { pais, resto };
  }
  return null;
}

function Bandeira({ codigo }: { codigo: string }) {
  return (
    <img
      className="phone-field__flag"
      src={`/bandeiras/${codigo.toLowerCase()}.svg`}
      alt=""
      width={21}
      height={14}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * Telefone com indicativo de país: botão com a bandeira (lista com pesquisa,
 * padrão combobox) e o número ao lado. Escrever ou colar "+44..." muda o
 * país sozinho. Por omissão Portugal, com as regras portuguesas; o número
 * completo vai num campo escondido `name`.
 */
export default function CampoTelefone({ name, label, required, className = "" }: CampoTelefoneProps) {
  const [pais, setPais] = useState<Pais>(PORTUGAL);
  const [numero, setNumero] = useState("");
  const [aberto, setAberto] = useState(false);
  const [procura, setProcura] = useState("");
  const [ativo, setAtivo] = useState(0);
  const [erroNativo, setErroNativo] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const numeroRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const idNumero = `${id}-numero`;
  const idPainel = `${id}-painel`;
  const idLista = `${id}-lista`;
  const idMensagem = `${id}-mensagem`;

  const opcoes = useMemo(() => {
    const q = semAcentos(procura.trim());
    if (!q) {
      const frequentes = MAIS_USADOS.map((c) => POR_CODIGO.get(c)).filter((p): p is Pais => Boolean(p));
      return { frequentes, todos: PAISES };
    }
    const digitos = q.replace(/^(\+|00)/, "");
    const todos = PAISES.filter((p) =>
      /^\d+$/.test(digitos)
        ? p.indicativo.startsWith(digitos)
        : semAcentos(p.nome).split(/[\s-]+/).some((palavra) => palavra.startsWith(q)) ||
          semAcentos(p.nome).startsWith(q) ||
          p.codigo.toLowerCase() === q
    );
    return { frequentes: [] as Pais[], todos };
  }, [procura]);
  const lista = [...opcoes.frequentes, ...opcoes.todos];

  const erroProprio = validarTelefoneComIndicativo(pais.indicativo, numero);
  const erro = erroProprio ?? erroNativo;
  const comErro = mostrar && erro !== null;

  // O erro fica no próprio campo, para o formulário não avançar com ele.
  useEffect(() => {
    numeroRef.current?.setCustomValidity(erroProprio ?? "");
  }, [erroProprio]);

  // A opção ativa fica sempre à vista ao andar com as setas.
  useEffect(() => {
    if (!aberto) return;
    listaRef.current?.querySelector<HTMLElement>(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo, aberto]);

  // Clique fora do campo fecha a lista.
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!raizRef.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  const abrir = () => {
    setProcura("");
    // Abre já na linha do país escolhido (nos mais usados, se lá estiver).
    const i = MAIS_USADOS.indexOf(pais.codigo);
    setAtivo(i >= 0 ? i : MAIS_USADOS.length + PAISES.indexOf(pais));
    setAberto(true);
  };

  const fechar = (devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  };

  const escolher = (p: Pais) => {
    setPais(p);
    setAberto(false);
    numeroRef.current?.focus();
  };

  const teclaProcura = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((a) => Math.min(a + 1, lista.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((a) => Math.max(a - 1, 0));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setAtivo(e.key === "Home" ? 0 : lista.length - 1);
    } else if (e.key === "Enter") {
      // Enter aqui nunca envia o formulário.
      e.preventDefault();
      if (lista[ativo]) escolher(lista[ativo]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      fechar(true);
    } else if (e.key === "Tab") {
      setAberto(false);
    }
  };

  const linha = (p: Pais, indice: number) => (
    <li
      key={`${indice < opcoes.frequentes.length ? "f" : "t"}-${p.codigo}`}
      id={`${id}-op-${indice}`}
      data-indice={indice}
      role="option"
      aria-selected={indice === ativo}
      className={`phone-field__option${p.codigo === pais.codigo ? " phone-field__option--atual" : ""}`}
      onPointerMove={() => setAtivo(indice)}
      // mousedown, não click: o foco não sai da pesquisa antes de escolher.
      onMouseDown={(e) => {
        e.preventDefault();
        escolher(p);
      }}
    >
      <Bandeira codigo={p.codigo} />
      <span className="phone-field__name">{p.nome}</span>
      <span className="phone-field__code">+{p.indicativo}</span>
    </li>
  );

  const classes = ["field", "phone-field", comErro ? "field--error" : "", className].filter(Boolean).join(" ");

  return (
    <div className={classes} ref={raizRef}>
      <label className="field__label" htmlFor={idNumero}>
        {label}
      </label>
      <div className="phone-field__anchor">
        <div className="phone-field__control">
          <button
            ref={botaoRef}
            type="button"
            className="phone-field__country"
            aria-haspopup="listbox"
            aria-expanded={aberto}
            aria-controls={aberto ? idPainel : undefined}
            aria-label={`Indicativo do país: ${pais.nome}, +${pais.indicativo}. Mudar`}
            onClick={() => (aberto ? fechar(false) : abrir())}
            onKeyDown={(e) => {
              if (!aberto && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                e.preventDefault();
                abrir();
              }
            }}
          >
            <Bandeira codigo={pais.codigo} />
            <span className="phone-field__dial">+{pais.indicativo}</span>
            <svg className="phone-field__chevron" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            ref={numeroRef}
            id={idNumero}
            className="phone-field__input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required={required}
            maxLength={20}
            placeholder={pais.codigo === "PT" ? "912 345 678" : undefined}
            aria-invalid={comErro || undefined}
            aria-describedby={comErro ? idMensagem : undefined}
            value={numero}
            onChange={(e) => {
              const valor = e.currentTarget.value;
              const separado = separarIndicativo(valor, pais);
              if (separado) {
                setPais(separado.pais);
                setNumero(separado.resto);
              } else {
                setNumero(valor.replace(/[^\d\s().-]/g, ""));
              }
              setErroNativo(null);
            }}
            onBlur={(e) => {
              const formatado = numero ? formatarNacional(pais.indicativo, numero) : "";
              if (formatado !== numero) setNumero(formatado);
              setErroNativo(mensagemNativa(e.currentTarget));
              setMostrar(numero !== "" || erro !== null);
            }}
            onInvalid={(e) => {
              const campo = e.currentTarget;
              setErroNativo(campo.validity.customError ? null : mensagemNativa(campo));
              setMostrar(true);
            }}
          />
        </div>

        {aberto && (
          <div id={idPainel} className="phone-field__panel">
            <div className="phone-field__search">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
                <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
              <input
                // A pesquisa é a razão de abrir a lista: o foco vai logo para ela.
                autoFocus
                type="search"
                role="combobox"
                aria-label="Procurar país ou indicativo"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={idLista}
                aria-activedescendant={lista[ativo] ? `${id}-op-${ativo}` : undefined}
                placeholder="Procurar país ou indicativo"
                autoComplete="off"
                value={procura}
                onChange={(e) => {
                  setProcura(e.currentTarget.value);
                  setAtivo(0);
                }}
                onKeyDown={teclaProcura}
              />
            </div>
            <ul ref={listaRef} id={idLista} role="listbox" aria-label="Países" className="phone-field__list">
              {opcoes.frequentes.length > 0 && (
                <li role="presentation" className="phone-field__group">
                  Mais usados
                </li>
              )}
              {opcoes.frequentes.map((p, i) => linha(p, i))}
              {opcoes.frequentes.length > 0 && (
                <li role="presentation" className="phone-field__group">
                  Todos os países
                </li>
              )}
              {opcoes.todos.map((p, i) => linha(p, opcoes.frequentes.length + i))}
              {lista.length === 0 && (
                <li role="presentation" className="phone-field__empty">
                  Nenhum país com esse nome ou indicativo.
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {comErro && (
        <span id={idMensagem} className="field__message">
          {erro}
        </span>
      )}
      <input type="hidden" name={name} value={telefoneCompleto(pais.indicativo, numero)} />
    </div>
  );
}
