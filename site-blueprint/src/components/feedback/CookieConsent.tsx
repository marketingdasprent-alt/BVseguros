import { useCallback, useEffect, useId, useRef, useState } from "react";
import Button from "../ui/Button";
import Link from "../../app/Link";
import useCookieConsent, {
  useOpenCookiePreferences,
} from "../../hooks/useCookieConsent";

/**
 * Cookie consent banner + preferences dialog. See
 * docs/design-system.md#cookieconsent for the contract and
 * DECISIONS.md for the two-tier consent model and the trigger pattern.
 *
 * Content below (`COPY`) is a placeholder: replace it with the real
 * cookie categories and legal text for the project before shipping
 * (docs/anti-ai.md#content-integrity).
 */
const COPY = {
  title: "Cookies e privacidade",
  body: "Usamos cookies estritamente necessários para o site funcionar e, com a sua autorização, cookies que nos ajudam a perceber como é usado.",
  acceptAll: "Aceitar todos",
  necessaryOnly: "Só os necessários",
  managePreferences: "Gerir preferências",
  dialogTitle: "Preferências de cookies",
  necessaryLabel: "Estritamente necessários",
  necessaryDescription: "Obrigatórios para o site funcionar. Sempre ativos.",
  optionalLabel: "Análise opcional",
  optionalDescription: "Ajuda a perceber o uso do site. Só carregado com a sua autorização.",
  save: "Guardar preferências",
  close: "Fechar",
};

export default function CookieConsent() {
  const { consent, setConsent } = useCookieConsent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [optionalChecked, setOptionalChecked] = useState(consent === "all");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const optionalId = useId();

  const bannerVisible = consent === null && !dialogOpen;

  useEffect(() => {
    document.body.classList.toggle("has-cookie-banner", bannerVisible);
    return () => document.body.classList.remove("has-cookie-banner");
  }, [bannerVisible]);

  const openDialog = useCallback(
    (trigger?: HTMLElement) => {
      triggerRef.current = trigger ?? null;
      setOptionalChecked(consent === "all");
      setDialogOpen(true);
    },
    [consent]
  );

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    const trigger = triggerRef.current;
    if (trigger && document.contains(trigger)) trigger.focus();
  }, []);

  useOpenCookiePreferences(
    useCallback(
      (event) => openDialog(event.detail?.trigger),
      [openDialog]
    )
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  return (
    <>
      {bannerVisible && (
        <div
          className="cookie-banner"
          role="region"
          aria-label={COPY.title}
        >
          <p className="cookie-banner__title">{COPY.title}</p>
          <p className="cookie-banner__body">{COPY.body}</p>
          <div className="cookie-banner__actions">
            <Button variant="primary" onClick={() => setConsent("all")}>
              {COPY.acceptAll}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setConsent("necessary")}
            >
              {COPY.necessaryOnly}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="cookie-banner__manage"
            onClick={(event) => openDialog(event.currentTarget)}
          >
            {COPY.managePreferences}
          </Button>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="cookie-dialog"
        aria-labelledby="cookie-dialog-title"
        onClose={closeDialog}
      >
        <form method="dialog" className="cookie-dialog__form">
          <div className="cookie-dialog__header">
            <h2 id="cookie-dialog-title" className="cookie-dialog__title">
              {COPY.dialogTitle}
            </h2>
            <button
              type="submit"
              className="cookie-dialog__close"
              aria-label={COPY.close}
            >
              &times;
            </button>
          </div>

          <div className="cookie-category">
            <div className="cookie-category__text">
              <p className="cookie-category__label">{COPY.necessaryLabel}</p>
              <p className="cookie-category__description">
                {COPY.necessaryDescription}
              </p>
            </div>
            <input type="checkbox" checked disabled aria-label={COPY.necessaryLabel} />
          </div>

          <div className="cookie-category">
            <div className="cookie-category__text">
              <label htmlFor={optionalId} className="cookie-category__label">
                {COPY.optionalLabel}
              </label>
              <p className="cookie-category__description">
                {COPY.optionalDescription}
              </p>
            </div>
            <input
              id={optionalId}
              type="checkbox"
              checked={optionalChecked}
              onChange={(event) => setOptionalChecked(event.target.checked)}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            className="cookie-dialog__save"
            onClick={() => {
              setConsent(optionalChecked ? "all" : "necessary");
              closeDialog();
            }}
          >
            {COPY.save}
          </Button>

          <Link
            href="/cookies"
            className="cookie-dialog__policy-link"
            onClick={() => setDialogOpen(false)}
          >
            Ler a Política de Cookies completa
          </Link>
        </form>
      </dialog>
    </>
  );
}
