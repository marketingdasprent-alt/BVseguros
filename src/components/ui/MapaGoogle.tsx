import { useState } from "react";
import Button from "./Button";
import LineIcon from "./LineIcon";
import PorConfirmar from "./PorConfirmar";
import useCookieConsent, { hasMarketingConsent } from "../../hooks/useCookieConsent";

/**
 * Mapa do Google Maps incorporado (sem chave de API). A Google define
 * cookies próprios, incluindo publicitários: carrega sozinho só com
 * consentimento de Marketing, senão espera por "Mostrar mapa". Sem
 * morada confirmada não carrega nada (ver /cookies, secção 3).
 */
export default function MapaGoogle({ morada }: { morada: string | null }) {
  const { consent } = useCookieConsent();
  const [mostrar, setMostrar] = useState(false);

  if (!morada) {
    return (
      <div className="map-card map-card--placeholder">
        <LineIcon nome="morada" size={32} />
        <p className="map-card__title">Mapa da nossa localização</p>
        <p className="text-body-small text-secondary">
          <PorConfirmar>Por confirmar: morada do escritório. O mapa aparece aqui quando estiver definida.</PorConfirmar>
        </p>
      </div>
    );
  }

  if (!mostrar && !(consent && hasMarketingConsent(consent))) {
    return (
      <div className="map-card map-card--placeholder">
        <LineIcon nome="morada" size={32} />
        <p className="map-card__title">{morada}</p>
        <p className="text-body-small text-secondary">
          O mapa é fornecido pela Google, que pode definir cookies. Só o
          carregamos se pedir.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setMostrar(true)}>
          Mostrar mapa
        </Button>
      </div>
    );
  }

  return (
    <div className="map-card">
      <iframe
        className="map-card__frame"
        title={`Mapa: ${morada}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(morada)}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
