import Button from "../../components/ui/Button";
import LegalLayout from "../../components/layout/LegalLayout";
import { OPEN_PREFERENCES_EVENT } from "../../hooks/useCookieConsent";

/**
 * Política de Cookies, associada ao CookieConsent.tsx e ao Google
 * Consent Mode v2 (src/utils/googleConsentMode.ts). Estrutura portada
 * de um projeto com esta mesma integração de consent mode já em
 * produção (ver DECISIONS.md). Conteúdo entre parênteses retos é
 * placeholder: substituir antes de publicar
 * (docs/anti-ai.md#content-integrity).
 */
export default function Cookies() {
  return (
    <LegalLayout title="Política de Cookies" updatedAt="22 de setembro de 2026">
      <p>
        Esta Política de Cookies explica o que são cookies, quais os que
        este site usa, e como pode gerir as suas preferências. Complementa
        a nossa <a href="/privacy">Política de Privacidade</a>.
      </p>

      <h2>1. O que são cookies?</h2>
      <p>
        Cookies são pequenos ficheiros de texto que um site coloca no seu
        dispositivo quando o visita. São amplamente usados para o site
        funcionar, ou funcionar melhor, e para dar informação aos
        responsáveis pelo site.
      </p>

      <h2>2. Categorias que usamos</h2>
      <p>
        Este site oferece três categorias de cookies, escolhidas na
        barra ou no painel de preferências abaixo:
      </p>
      <ul>
        <li>
          <strong>Estritamente necessários</strong>, obrigatórios para o
          site funcionar (segurança, navegação básica). Não requerem
          consentimento.
        </li>
        <li>
          <strong>Análise</strong>, ajuda-nos a perceber como os
          visitantes usam o site, de forma agregada e anonimizada
          (Google Analytics).
        </li>
        <li>
          <strong>Marketing e publicidade</strong>, usado para medir e
          personalizar anúncios (Meta Pixel).
        </li>
      </ul>

      <h2>3. Google Consent Mode v2</h2>
      <p>
        Implementamos o <em>Google Consent Mode v2</em>. Por predefinição,
        todos os sinais de consentimento (<code>ad_storage</code>,{" "}
        <code>ad_user_data</code>, <code>ad_personalization</code>,{" "}
        <code>analytics_storage</code>) estão <strong>negados</strong> até
        dar consentimento explícito na barra de cookies.{" "}
        <code>analytics_storage</code> é concedido pela categoria
        Análise; <code>ad_storage</code>, <code>ad_user_data</code> e{" "}
        <code>ad_personalization</code> só são concedidos pela categoria
        Marketing e publicidade, nunca pela categoria Análise sozinha.
      </p>

      <h2>4. Gerir as suas preferências</h2>
      <p>
        Pode aceitar, recusar ou alterar as suas preferências a qualquer
        momento. Reabra o painel de preferências aqui:
      </p>
      <p>
        <Button
          type="button"
          variant="secondary"
          onClick={(event) =>
            window.dispatchEvent(
              new CustomEvent(OPEN_PREFERENCES_EVENT, {
                detail: { trigger: event.currentTarget },
              })
            )
          }
        >
          Gerir preferências de cookies
        </Button>
      </p>
      <p>
        Também pode bloquear ou eliminar cookies através das definições do
        seu browser. Desativar certos cookies pode afetar o funcionamento
        do site.
      </p>

      <h2>5. Conservação</h2>
      <p>
        A sua escolha fica guardada no armazenamento local deste browser
        (<code>localStorage</code>) até a alterar ou limpar os dados do
        browser.
      </p>

      <h2>6. Atualizações</h2>
      <p>
        Esta política pode ser revista. A data da última atualização está
        indicada no topo desta página.
      </p>
    </LegalLayout>
  );
}
