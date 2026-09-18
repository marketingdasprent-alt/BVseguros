import type { Consent } from "../hooks/useCookieConsent";

/**
 * Google Consent Mode v2 bridge. Ported from a project that shipped this
 * exact wiring in production (see DECISIONS.md): the default-denied state
 * belongs in index.html, loaded before any analytics/ads script; this
 * module only sends the `consent update` once the visitor has answered
 * the banner, mapped from the Blueprint's two-tier consent model.
 *
 * Safe to call even when no gtag.js is ever loaded (no GA4/Ads on the
 * project): `window.gtag` is undefined, the call is a no-op.
 *
 * "all" only grants the categories this banner actually offers consent
 * for (analytics). ad_storage/ad_user_data/ad_personalization stay
 * denied: a project that also needs ads consent must add a third
 * category to the banner (see docs/design-system.md#cookieconsent)
 * rather than silently granting ad consent nobody was asked about.
 */

type GtagConsentState = {
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  functionality_storage: "granted" | "denied";
  personalization_storage: "granted" | "denied";
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const DENIED_ALL: GtagConsentState = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
};

export function consentStateFor(consent: Consent): GtagConsentState {
  if (consent === "necessary") return DENIED_ALL;
  return {
    ...DENIED_ALL,
    analytics_storage: "granted",
    functionality_storage: "granted",
    personalization_storage: "granted",
  };
}

export function applyGoogleConsentMode(consent: Consent) {
  window.gtag?.("consent", "update", consentStateFor(consent));
}
