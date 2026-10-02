import type { ReactNode } from "react";
import Container from "./Container";
import Section from "./Section";
import useHeroFotos from "../../hooks/useHeroFotos";
import type { SlideHero } from "../../data/fotosHero";

type Props = {
  slides: SlideHero[];
  /** Na Home, 24 fotos mas um ponto por seguro (ver useHeroFotos). */
  pontos?: number;
  /** Breadcrumb ou outro bloco acima do texto. */
  topo?: ReactNode;
  rotulo?: ReactNode;
  titulo: ReactNode;
  lede: ReactNode;
  acoes?: ReactNode;
  /** Linha por baixo das ações (ex.: a garantia da Home). */
  nota?: ReactNode;
  /** Conteúdo a toda a largura dentro do hero (ex.: o seletor de ramos da Home). */
  children?: ReactNode;
};

/** Hero escuro com fotografias a rolar: o mesmo em Home, Seguros, ramos e Sinistros. */
export default function HeroFotos({ slides, pontos, topo, rotulo, titulo, lede, acoes, nota, children }: Props) {
  const heroFotos = useHeroFotos(slides, pontos);
  return (
    <Section className="hero-dark hero-fotos" variant="compact">
      {heroFotos.fundo}
      <Container>
        {topo}
        <div className={"grid hero-fotos__grelha" + (topo ? " mt-md" : "")}>
          <div className="col-span-7">
            {rotulo && <p className="text-label">{rotulo}</p>}
            <h1 className={rotulo ? "mt-2xs" : undefined}>{titulo}</h1>
            <p className="text-body-large text-secondary mt-sm">{lede}</p>
            {acoes && <div className="cluster mt-lg">{acoes}</div>}
            {nota}
          </div>
          <div className="hero-fotos__lado">{heroFotos.controlos}</div>
        </div>
        {children}
      </Container>
    </Section>
  );
}
