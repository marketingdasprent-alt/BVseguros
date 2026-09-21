import LegalLayout from "../../components/layout/LegalLayout";

/**
 * Política de Privacidade com estrutura RGPD. Estrutura e referências
 * de base legal portadas de um projeto já em produção (ver
 * DECISIONS.md): o conteúdo dentro de cada secção é placeholder
 * (entre parênteses retos) e tem de ser substituído pelos dados reais
 * da BV Seguros antes de publicar (docs/anti-ai.md#content-integrity).
 * Não publicar com os parênteses retos por preencher.
 */
export default function Privacy() {
  return (
    <LegalLayout title="Política de Privacidade" updatedAt="[DATA]">
      <p>
        Esta Política de Privacidade descreve como a{" "}
        <strong>BV Seguros</strong> (&quot;nós&quot;) recolhe, usa e protege
        os dados pessoais de quem visita este site ou nos contacta sobre os
        nossos serviços.
      </p>

      <h2>1. Responsável pelo tratamento</h2>
      <p>
        O responsável pelo tratamento é a <strong>BV Seguros</strong>,{" "}
        [MORADA REGISTADA]. Para qualquer questão sobre privacidade,
        contacte-nos através de{" "}
        <a href="mailto:geral@bvseguros.pt">geral@bvseguros.pt</a> ou{" "}
        <a href="tel:[TELEFONE DE CONTACTO]">[TELEFONE DE CONTACTO]</a>.
      </p>

      <h2>2. Dados pessoais que recolhemos</h2>
      <p>Dependendo de como interage connosco, podemos recolher:</p>
      <ul>
        <li>
          <strong>Dados de identificação e contacto:</strong> nome, número de
          telefone, endereço de email.
        </li>
        <li>
          <strong>Dados relativos ao seguro:</strong> dados necessários para
          preparar uma proposta ou gerir uma apólice (ex.: dados do veículo,
          da habitação ou de saúde relevantes para o ramo contratado).
        </li>
        <li>
          <strong>Dados de navegação:</strong> endereço IP, tipo de
          dispositivo/browser, páginas visitadas, tempo na página, recolhidos
          quando aplicável e com consentimento (ver a{" "}
          <a href="/cookies">Política de Cookies</a>).
        </li>
      </ul>

      <h2>3. Finalidades e base legal</h2>
      <p>Tratamos dados pessoais para as seguintes finalidades:</p>
      <ul>
        <li>
          <strong>Prestar o serviço solicitado</strong>, execução de um
          contrato (RGPD Art. 6.º, n.º 1, al. b)).
        </li>
        <li>
          <strong>Responder a pedidos de informação</strong>, diligências
          pré-contratuais a seu pedido.
        </li>
        <li>
          <strong>Obrigações legais e fiscais</strong> (RGPD Art. 6.º, n.º 1,
          al. c)).
        </li>
        <li>
          <strong>Melhoria do site e análise anonimizada</strong>, com o seu
          consentimento, revogável a qualquer momento.
        </li>
      </ul>

      <h2>4. Prazo de conservação</h2>
      <p>
        Os dados são conservados apenas pelo tempo necessário à finalidade
        para que foram recolhidos, ou pelo prazo exigido por lei (ex.:
        [X] anos para registos fiscais/de mediação de seguros, nos termos da
        legislação aplicável).
      </p>

      <h2>5. Partilha com terceiros</h2>
      <p>
        Não vendemos dados pessoais. Podemos partilhar dados estritamente
        necessários com seguradoras parceiras (para emissão e gestão de
        apólices), subcontratantes que atuam em nosso nome (ex.:
        alojamento, faturação) ou autoridades públicas quando legalmente
        exigido.
      </p>

      <h2>6. Transferências internacionais</h2>
      <p>
        Quando um prestador de serviços se encontra fora do Espaço
        Económico Europeu (ex.: análise de dados ou alojamento),
        asseguramos garantias adequadas, como as Cláusulas Contratuais-Tipo
        da Comissão Europeia.
      </p>

      <h2>7. Os seus direitos</h2>
      <p>
        Ao abrigo do RGPD, tem direito a aceder, retificar, apagar,
        limitar ou opor-se ao tratamento dos seus dados, e direito à
        portabilidade dos dados. Pode também apresentar reclamação junto da{" "}
        <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong>.
      </p>
      <p>Para exercer os seus direitos, contacte-nos pelos meios indicados na secção 1.</p>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizativas adequadas para proteger
        os seus dados contra acesso não autorizado, perda ou destruição.
      </p>

      <h2>9. Alterações a esta política</h2>
      <p>
        Podemos atualizar esta Política de Privacidade periodicamente. A
        data da última atualização está indicada no topo desta página.
      </p>
    </LegalLayout>
  );
}
