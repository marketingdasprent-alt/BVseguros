import { useEffect } from "react";

const TITULO_BASE = document.title;
const DESCRICAO_BASE = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";

/** Título do separador e meta description por página; repõe os do index.html ao sair. */
export default function useDocumentTitle(titulo: string, descricao?: string) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    document.title = titulo;
    if (descricao) meta?.setAttribute("content", descricao);
    return () => {
      document.title = TITULO_BASE;
      meta?.setAttribute("content", DESCRICAO_BASE);
    };
  }, [titulo, descricao]);
}
