import { useEffect, useState } from "react";

/**
 * Id da secção que está a ser lida: a última cujo topo já passou uma
 * linha a 35% da altura do ecrã. Por scroll (com rAF) e não por
 * IntersectionObserver, que deixava a marca parada entre secções.
 */
export default function useSecaoAtiva(ids: string[]) {
  const [ativa, setAtiva] = useState<string | null>(null);
  const chave = ids.join(",");

  useEffect(() => {
    const lista = chave.split(",");
    let pedido = 0;
    const medir = () => {
      pedido = 0;
      const linha = window.innerHeight * 0.35;
      let atual: string | null = null;
      for (const id of lista) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= linha) atual = id;
      }
      setAtiva(atual);
    };
    const onScroll = () => {
      if (!pedido) pedido = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(pedido);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [chave]);

  return ativa;
}
