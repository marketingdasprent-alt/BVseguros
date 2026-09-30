import { useId, useState } from "react";
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
 * Os cartões são uma escolha (radio): nenhum vem marcado; o escolhido fica
 * em destaque e segue para o pedido de proposta.
 * Em ecrãs estreitos as três colunas não cabem: separadores por cima
 * escolhem o nível visível, e as outras colunas ficam escondidas (também
 * para leitores de ecrã, que leem só o nível escolhido).
 */
export default function ComparacaoNiveis({
  dados,
  onPedirProposta,
}: {
  dados: NiveisProtecao;
  /** Abre o pop-up com o formulário do ramo, com o nível escolhido. */
  onPedirProposta: (nivel: string) => void;
}) {
  const grupo = useId();
  const [escolhido, setEscolhido] = useState<number | null>(null);
  // Em mobile a tabela mostra um nível de cada vez: o escolhido, ou o do meio até haver escolha.
  const [nivelMovel, setNivelMovel] = useState("1");
  const escolher = (i: number) => {
    setEscolhido(i);
    setNivelMovel(String(i));
  };
  const tabs = dados.niveis.map((n, i) => ({ valor: String(i), label: n.nome }));

  return (
    <>
      <fieldset className="level-picker">
        <legend className="visually-hidden">Escolha o nível de proteção</legend>
        <ul className="level-cards" role="list">
          {dados.niveis.map((nivel, i) => {
            const id = `${grupo}-${i}`;
            const marcado = escolhido === i;
            return (
              <li key={nivel.nome} className={"level-card" + (marcado ? " level-card--featured" : "")}>
                <input
                  type="radio"
                  id={id}
                  name={grupo}
                  className="level-card__radio visually-hidden"
                  checked={marcado}
                  onChange={() => escolher(i)}
                />
                {/* O rótulo cobre o cartão: clicar em qualquer ponto escolhe o nível. */}
                <label htmlFor={id} className="level-card__pick">
                  <span className="level-card__step">Nível {i + 1}</span>
                  <span className="level-card__name">{nivel.nome}</span>
                  <span className="text-secondary">{nivel.resumo}</span>
                </label>
                <Button
                  onClick={() => {
                    escolher(i);
                    onPedirProposta(nivel.nome);
                  }}
                  variant={marcado ? "primary" : "secondary"}
                  size="sm"
                  aria-label={`Pedir proposta com o nível ${nivel.nome}`}
                >
                  Pedir proposta
                </Button>
              </li>
            );
          })}
        </ul>
      </fieldset>

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
