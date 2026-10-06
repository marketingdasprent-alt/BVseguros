import PorConfirmar from "./PorConfirmar";
import { EMPRESA, hrefDado } from "../../data/empresa";
import type { CampoEmpresa } from "../../data/empresa";

/** Um dado da empresa: o valor (com link, se tiver) ou a marca de por confirmar. */
export default function DadoEmpresa({ campo }: { campo: CampoEmpresa }) {
  const { valor, confirmado } = EMPRESA[campo];
  if (!confirmado) return <PorConfirmar>{valor}</PorConfirmar>;
  const href = hrefDado(campo);
  return href ? <a href={href}>{valor}</a> : <>{valor}</>;
}

/** " (Denominação, NIPC …)" a seguir ao nome nas páginas legais; nada enquanto não estiver confirmada. */
export function IdentificacaoLegal() {
  const { denominacaoSocial, nipc } = EMPRESA;
  if (!denominacaoSocial.confirmado) return null;
  return (
    <>
      {" "}({denominacaoSocial.valor}
      {nipc.confirmado && <>, NIPC {nipc.valor}</>})
    </>
  );
}
