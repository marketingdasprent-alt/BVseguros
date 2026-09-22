import LegalLayout from "../../components/layout/LegalLayout";
import PorConfirmar from "../../components/ui/PorConfirmar";

/**
 * Esqueleto genérico de Termos e Condições. Ao contrário de
 * Privacidade/Cookies, os termos são inerentemente específicos ao que
 * a empresa vende: isto é um esqueleto de secções a preencher, não um
 * texto jurídico revisto pronto a usar. A morada e a comarca abaixo
 * são fictícias, propositadamente (mesmo valor usado em Privacy.tsx e
 * no contacto da Home), marcadas com PorConfirmar para nunca serem
 * confundidas com facto real; ver DECISIONS.md. Os restantes
 * parênteses retos são placeholder de conteúdo a escrever, não dados a
 * substituir (docs/anti-ai.md#content-integrity).
 */
export default function Terms() {
  return (
    <LegalLayout title="Termos e Condições" updatedAt="22 de setembro de 2026">
      <p>
        Estes Termos e Condições regem o uso deste site e dos serviços
        prestados pela <strong>BV Seguros</strong>. Ao usar este site ou
        contratar os nossos serviços, aceita estes termos.
      </p>

      <h2>1. Sobre nós</h2>
      <p>
        <strong>BV Seguros</strong>,{" "}
        <PorConfirmar>Rua das Flores, nº 123, 1200-192 Lisboa (fictício, por confirmar)</PorConfirmar>
        . Contacto: <a href="mailto:geral@bvseguros.pt">geral@bvseguros.pt</a>.
      </p>

      <h2>2. Serviços</h2>
      <p>
        A BV Seguros atua como mediadora/corretora de seguros,
        intermediando a contratação de apólices entre o cliente e
        seguradoras terceiras. [Descrever com mais detalhe o âmbito exato
        da mediação e eventuais condições de acesso ao serviço.]
      </p>

      <h2>3. Propostas, pagamento e cancelamento</h2>
      <p>
        [Descrever como as propostas de seguro são preparadas e aceites,
        os métodos de pagamento de prémios aceites, e a política de
        cancelamento/resolução de apólices.]
      </p>

      <h2>4. Responsabilidade</h2>
      <p>
        [Descrever os limites de responsabilidade da BV Seguros enquanto
        mediadora, distintos da responsabilidade da seguradora emitente,
        nos termos permitidos por lei.]
      </p>

      <h2>5. Propriedade intelectual</h2>
      <p>
        Todo o conteúdo deste site (texto, imagens, logótipo) pertence à{" "}
        <strong>BV Seguros</strong> ou aos seus licenciadores, salvo
        indicação em contrário.
      </p>

      <h2>6. Lei aplicável</h2>
      <p>
        Estes termos regem-se pela lei portuguesa. Qualquer litígio será
        submetido aos tribunais competentes da{" "}
        <PorConfirmar>Comarca de Lisboa (fictício, por confirmar)</PorConfirmar>.
      </p>

      <h2>7. Alterações a estes termos</h2>
      <p>
        Podemos atualizar estes termos periodicamente. A data da última
        atualização está indicada no topo desta página.
      </p>
    </LegalLayout>
  );
}
