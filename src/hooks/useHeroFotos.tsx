import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "../app/Link";
import type { SlideHero } from "../data/fotosHero";

const INTERVALO_MS = 6000;

const reduzMovimento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Fotografias de fundo do hero, a trocar sozinhas com fade. Devolve o fundo
 * (vai logo dentro da secção .hero-fotos) e os controlos (pontos + pausa), que
 * a página põe onde fizer sentido. `pontos` agrupa os slides: na Home há 24
 * fotos mas só 6 pontos, um por seguro. Pausa obrigatória (WCAG 2.2.2) e
 * nada roda para quem pediu menos movimento.
 */
export default function useHeroFotos(slides: SlideHero[], pontos = slides.length) {
  const total = slides.length;
  // Só monta a foto atual e a seguinte: as outras descarregam quando chega a vez.
  const [estado, setEstado] = useState(() => ({ atual: 0, montadas: new Set([0, 1 % Math.max(total, 1)]) }));
  const { atual, montadas } = estado;
  const [pausado, setPausado] = useState(reduzMovimento);

  const irPara = (i: number) =>
    setEstado((e) => ({ atual: i, montadas: new Set(e.montadas).add(i).add((i + 1) % total) }));

  useEffect(() => {
    if (pausado || total < 2) return;
    const t = window.setTimeout(
      () => setEstado((e) => {
        const i = (e.atual + 1) % total;
        return { atual: i, montadas: new Set(e.montadas).add(i).add((i + 1) % total) };
      }),
      INTERVALO_MS
    );
    return () => window.clearTimeout(t);
  }, [atual, pausado, total]);

  const fundo = (
    <div className="hero-fotos__fundo" aria-hidden="true">
      {slides.map((s, i) =>
        montadas.has(i) ? (
          <img
            key={s.foto}
            src={`${s.foto}-1920.webp`}
            srcSet={`${s.foto}-960.webp 960w, ${s.foto}-1920.webp 1920w`}
            sizes="100vw"
            alt=""
            decoding="async"
            fetchPriority={i === 0 ? "high" : undefined}
            className={i === atual ? "is-ativa" : undefined}
          />
        ) : null
      )}
    </div>
  );

  const legenda = slides[atual]?.legenda;
  const grupo = Math.floor(atual / pontos) * pontos;
  const controlos: ReactNode =
    total < 2 ? null : (
      <div className="hero-fotos__controlos">
        {legenda && (
          <Link href={legenda.href} className="hero-fotos__legenda">
            <span className="hero-fotos__legenda-acao">{legenda.acao}</span>
            <span className="hero-fotos__legenda-titulo">{legenda.titulo}</span>
          </Link>
        )}
        <div className="hero-fotos__navegacao">
          <div className="hero-fotos__pontos">
            {Array.from({ length: Math.min(pontos, total) }, (_, k) => {
              const alvo = Math.min(grupo + k, total - 1);
              const rotulo = slides[alvo].legenda?.titulo ?? `Fotografia ${k + 1} de ${pontos}`;
              return (
                <button
                  key={k}
                  type="button"
                  className="hero-fotos__ponto"
                  aria-label={`Mostrar ${rotulo}`}
                  aria-current={atual % pontos === k ? "true" : undefined}
                  onClick={() => irPara(alvo)}
                />
              );
            })}
          </div>
          <button
            type="button"
            className="hero-fotos__pausa"
            aria-label={pausado ? "Retomar fotografias" : "Pausar fotografias"}
            onClick={() => setPausado((p) => !p)}
          >
            {pausado ? (
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" /></svg>
            )}
          </button>
        </div>
      </div>
    );

  return { fundo, controlos };
}
