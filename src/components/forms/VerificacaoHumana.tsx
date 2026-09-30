import { useEffect, useRef } from "react";
import type { VerificacaoHumana } from "./useVerificacaoHumana";

/**
 * Cloudflare Turnstile: confirma que quem envia o formulário não é um robô, sem
 * cookies de rastreio. Em "interaction-only" fica invisível e só aparece uma caixa
 * quando a Cloudflare tem dúvidas. O token é confirmado no servidor (api/pedido.ts).
 */

type Turnstile = {
  render(el: HTMLElement, opcoes: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// Em desenvolvimento, sem chave própria, usa a chave de teste da Cloudflare (passa sempre).
const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || (import.meta.env.DEV ? "1x00000000000000000000AA" : "");

let carregamento: Promise<Turnstile> | null = null;

function carregarTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  carregamento ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile sem API")));
    script.onerror = () => {
      carregamento = null;
      reject(new Error("Não foi possível carregar o Turnstile"));
    };
    document.head.appendChild(script);
  });
  return carregamento;
}

/** Onde o widget se desenha: vazio e sem espaço, salvo quando a Cloudflare pede interação. */
export default function CaixaVerificacao({ verificacao }: { verificacao: VerificacaoHumana }) {
  const contentor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!SITE_KEY) {
      console.error("Falta VITE_TURNSTILE_SITE_KEY: os formulários não conseguem ser enviados.");
      return;
    }
    let ativo = true;
    let id: string | null = null;
    carregarTurnstile()
      .then((t) => {
        if (!ativo || !contentor.current) return;
        const widget = t.render(contentor.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          callback: (valor: string) => verificacao.definirToken(valor),
          "expired-callback": () => verificacao.definirToken(null),
          "error-callback": () => verificacao.definirToken(null),
        });
        id = widget;
        verificacao.ligar(() => t.reset(widget));
      })
      .catch((erro: unknown) => console.warn(erro));
    // Sai do ecrã (pedido enviado, pop-up fechado): o widget vai com ele e volta a ser desenhado se o formulário regressar.
    return () => {
      ativo = false;
      verificacao.desligar();
      if (id) window.turnstile?.remove(id);
    };
  }, [verificacao]);

  return <div ref={contentor} className="human-check" />;
}
