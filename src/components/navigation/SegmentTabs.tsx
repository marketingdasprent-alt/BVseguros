import { useRef } from "react";
import type { KeyboardEvent } from "react";

export type Tab<T extends string> = { valor: T; label: string };

/**
 * Tabs ARIA (setas, Home, End; activação automática). O painel é do
 * chamador: tem de ter id `${id}-painel` e aria-labelledby na tab ativa.
 */
export default function SegmentTabs<T extends string>({
  id,
  label,
  tabs,
  ativo,
  onChange,
}: {
  id: string;
  label: string;
  tabs: Tab<T>[];
  ativo: T;
  onChange: (valor: T) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    const ultimo = tabs.length - 1;
    const destino =
      event.key === "ArrowRight" ? (i === ultimo ? 0 : i + 1)
      : event.key === "ArrowLeft" ? (i === 0 ? ultimo : i - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? ultimo
      : null;
    if (destino === null) return;
    event.preventDefault();
    onChange(tabs[destino].valor);
    refs.current[destino]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="segment-tabs">
      {tabs.map((tab, i) => {
        const selecionado = tab.valor === ativo;
        return (
          <button
            key={tab.valor}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${tab.valor}`}
            aria-selected={selecionado}
            aria-controls={`${id}-painel`}
            tabIndex={selecionado ? 0 : -1}
            className="segment-tabs__tab"
            onClick={() => onChange(tab.valor)}
            onKeyDown={(event) => handleKeyDown(event, i)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
