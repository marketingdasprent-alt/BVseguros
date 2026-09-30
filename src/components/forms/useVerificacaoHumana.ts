import { useMemo, useRef } from "react";

/**
 * Estado da verificação anti-robô de um formulário: o token que o Turnstile entrega
 * (src/components/forms/VerificacaoHumana.tsx) e como pedir um novo depois de enviar.
 */
export type VerificacaoHumana = {
  definirToken: (token: string | null) => void;
  ligar: (reiniciarWidget: () => void) => void;
  desligar: () => void;
  /** Espera pelo token (a verificação demora um instante); null se não chegar a tempo. */
  obterToken: (esperaMs?: number) => Promise<string | null>;
  /** Cada token só serve uma vez: depois de enviar, pede um novo. */
  reiniciar: () => void;
};

export function useVerificacaoHumana(): VerificacaoHumana {
  const estado = useRef<{ token: string | null; reiniciarWidget: (() => void) | null }>({ token: null, reiniciarWidget: null });

  return useMemo(
    () => ({
      definirToken: (valor) => {
        estado.current.token = valor;
      },
      ligar: (fn) => {
        estado.current.reiniciarWidget = fn;
      },
      desligar: () => {
        estado.current = { token: null, reiniciarWidget: null };
      },
      obterToken: async (esperaMs = 8000) => {
        const fim = Date.now() + esperaMs;
        while (!estado.current.token && Date.now() < fim) await new Promise((r) => setTimeout(r, 200));
        return estado.current.token;
      },
      reiniciar: () => {
        estado.current.token = null;
        estado.current.reiniciarWidget?.();
      },
    }),
    []
  );
}
