import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Link from "../app/Link";
import ContactoForm from "../sections/ContactoForm";
import SinistroForm from "../sections/SinistroForm";
import { useSearch } from "../app/router";
import type { ModoPedido } from "../app/proposta";
import { FORMULARIOS } from "../data/formularios";
import type { FormularioRamo } from "../data/formularios";
import { SEGUROS_FORMULARIO, hrefSeguro } from "../data/seguros";
import type { Seguro } from "../data/seguros";
import useDocumentTitle from "../hooks/useDocumentTitle";

const TEXTO_SINISTRO =
  "Conte-nos o que aconteceu. Um mediador da BV fala consigo e acompanha o processo junto da seguradora.";

/** O nível escolhido na página do ramo já vem marcado, se o formulário tiver essa opção. */
function comNivel(formulario: FormularioRamo, nivel: string | null): FormularioRamo {
  if (!nivel) return formulario;
  return {
    ...formulario,
    passos: formulario.passos.map((p) => ({
      ...p,
      campos: p.campos.map((c) => (c.nome === "protecao" && c.opcoes?.includes(nivel) ? { ...c, padrao: nivel } : c)),
    })),
  };
}

/**
 * O pedido de proposta ou de sinistro numa página inteira, como o simulador
 * da Fidelidade: uma barra mínima (logótipo e "Sair") em vez do menu do
 * site, e o formulário a ocupar a largura toda, em 2 colunas. Com ramo, o
 * formulário já vem com as perguntas desse ramo.
 */
export default function PaginaPedido({ modo, seguro }: { modo: ModoPedido; seguro?: Seguro }) {
  const sinistro = modo === "sinistro";
  const nivel = new URLSearchParams(useSearch()).get("nivel")?.trim().slice(0, 40) || null;
  const formulario = seguro && !sinistro ? comNivel(FORMULARIOS[seguro.key], nivel) : undefined;

  const titulo = sinistro ? "Participar sinistro." : (formulario?.titulo ?? "Peça uma proposta.");
  const texto = sinistro ? TEXTO_SINISTRO : (formulario?.texto ?? "Diga-nos que seguro procura e um mediador da BV fala consigo.");
  const nomeSeguro = seguro ? seguro.nome.toLowerCase() : "";
  useDocumentTitle(
    sinistro
      ? `Participar sinistro${seguro ? ` ${nomeSeguro}` : ""} | BV Seguros`
      : `Pedir proposta${seguro ? ` de seguro ${nomeSeguro}` : ""} | BV Seguros`,
    texto
  );

  // "Sair" volta à página de onde o pedido normalmente se abre.
  const sair = sinistro ? "/sinistros" : seguro ? hrefSeguro(seguro) : "/";

  return (
    <div className="pedido">
      <div className="pedido__barra">
        <Container>
          <div className="pedido__barra-conteudo">
            <Link href="/" className="header__logo">
              <img src="/images/logo-icon-bv-seguros.png" alt="" className="header__logo-mark" />
              BV Seguros
            </Link>
            <Link href={sair} className="pedido__sair" aria-label="Sair do pedido">
              <span aria-hidden="true">✕</span> Sair
            </Link>
          </div>
        </Container>
      </div>

      <Section variant="compact">
        <Container>
          <header className="pedido__cabecalho">
            <h1 className="pedido__titulo">{titulo}</h1>
            <p className="text-secondary">{texto}</p>
            {nivel && <p className="pedido__contexto">Nível de proteção pretendido: {nivel}</p>}
          </header>
          {sinistro ? (
            <SinistroForm key={`sinistro-${seguro?.key ?? "geral"}`} ramoInicial={seguro?.key} />
          ) : (
            <ContactoForm
              key={seguro?.key ?? "geral"}
              ramos={SEGUROS_FORMULARIO}
              ramoFixo={seguro && formulario ? { valor: seguro.ramoCrm, formulario } : undefined}
              nivel={nivel}
            />
          )}
        </Container>
      </Section>
    </div>
  );
}
