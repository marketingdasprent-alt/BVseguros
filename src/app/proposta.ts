import { useSyncExternalStore } from "react";
import type { RamoKey } from "../data/seguros";

/**
 * Estado do pop-up de formulários: um só modal montado no App, aberto de
 * qualquer botão (cartões, hero, header, níveis), em modo proposta ou sinistro. Estado de módulo
 * com useSyncExternalStore, como o useCookieConsent, em vez de um Context.
 */
/** "proposta": pedir uma proposta; "sinistro": pedir ajuda com um sinistro (pedidos_sinistro no CRM). */
export type ModoPopup = "proposta" | "sinistro";

type EstadoProposta =
  | { aberto: false }
  | {
      aberto: true;
      modo: ModoPopup;
      ramo: RamoKey | null;
      /** Linhas "Rótulo: valor" já escolhidas na página (ex.: o nível de proteção), para a mensagem do lead. */
      contexto: string[];
      origem: HTMLElement | null;
    };

let estado: EstadoProposta = { aberto: false };
const listeners = new Set<() => void>();

function notificar() {
  for (const listener of listeners) listener();
}

function abrir(modo: ModoPopup, ramo: RamoKey | null, contexto: string[] = []) {
  const origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  estado = { aberto: true, modo, ramo, contexto, origem };
  notificar();
}

/** Sem ramo: formulário genérico, com a escolha do seguro. */
export function abrirProposta(ramo: RamoKey | null = null, contexto: string[] = []) {
  abrir("proposta", ramo, contexto);
}

/** Pedido de sinistro; com ramo, o tipo de seguro já vem escolhido. */
export function abrirSinistro(ramo: RamoKey | null = null) {
  abrir("sinistro", ramo);
}

export function fecharProposta() {
  if (!estado.aberto) return;
  const { origem } = estado;
  estado = { aberto: false };
  notificar();
  // Devolve o foco ao botão que abriu, se ainda existir na página.
  if (origem && document.contains(origem)) origem.focus();
}

export function usePropostaAberta() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => estado
  );
}
