import { useState } from "react";
import Button from "./Button";
import SegmentTabs from "../navigation/SegmentTabs";
import type { Disponibilidade, NiveisProtecao } from "../../data/seguros";

const ROTULO: Record<Disponibilidade, string> = {
  incluido: "Incluído",
  opcional: "Opcional",
  nao: "Não incluído",
};

/**
 * Três níveis em cartões + tabela por cobertura (tabela real, th scope).
 * Em ecrãs estreitos as três colunas não cabem: separadores por cima
 * escolhem o nível visível, e as outras colunas ficam escondidas (também
 * para leitores de ecrã, que leem só o nível escolhido).
 */
export default function ComparacaoNiveis({ dados }: { dados: NiveisProtecao }) {
  // Começa no nível do meio, o que está em destaque nos cartões.
  const [nivelMovel, setNivelMovel] = useState("1");
  const tabs = dados.niveis.map((n, i) => ({ valor: String(i), label: n.nome }));

  return (
    <>
      <ul className="level-cards" role="list">
        {dados.niveis.map((nivel, i) => (
          <li key={nivel.nome} className={"level-card" + (i === 1 ? " level-card--featured" : "")}>
            <p className="level-card__step">Nível {i + 1}</p>
            <h3>{nivel.nome}</h3>
            <p className="text-secondary">{nivel.resumo}</p>
            <Button as="a" href="#contacto" variant={i === 1 ? "primary" : "secondary"} size="sm">
              Pedir proposta
            </Button>
          </li>
        ))}
      </ul>

      <div className="compare-tabs">
        <SegmentTabs id="niveis" label="Nível a comparar" tabs={tabs} ativo={nivelMovel} onChange={setNivelMovel} />
      </div>

      <div
        id="niveis-painel"
        className="compare-table-wrap"
        role="region"
        aria-label="Comparação dos níveis de proteção"
        tabIndex={0}
        data-nivel-movel={nivelMovel}
      >
        <table className="compare-table">
          <caption className="visually-hidden">Coberturas incluídas em cada nível de proteção</caption>
          <thead>
            <tr>
              <th scope="col">Cobertura</th>
              {dados.niveis.map((n, i) => (
                <th key={n.nome} scope="col" data-nivel={i}>
                  {n.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.linhas.map((linha) => (
              <tr key={linha.cobertura}>
                <th scope="row">{linha.cobertura}</th>
                {linha.valores.map((v, i) => (
                  <td key={dados.niveis[i].nome} data-nivel={i}>
                    <span className={`availability availability--${v}`}>{ROTULO[v]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-caption text-muted" style={{ marginTop: "var(--space-sm)" }}>
        Níveis ilustrativos para orientar a conversa. Cada seguradora tem as
        suas próprias opções: a proposta real depende da seguradora e do seu
        caso.
      </p>
    </>
  );
}
