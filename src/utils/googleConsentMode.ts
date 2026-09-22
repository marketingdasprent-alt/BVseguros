import type { Consent } from "../hooks/useCookieConsent";
import { hasAnalyticsConsent, hasMarketingConsent } from "../hooks/useCookieConsent";

/**
 * Google Consent Mode v2 bridge. Ported from a project that shipped this
 * exact wiring in production (see DECISIONS.md): the default-denied state
 * belongs in index.html, loaded before any analytics/ads script; this
 * module only sends the `consent update` once the visitor has answered
 * the banner.
 *
 * Safe to call even when no gtag.js is ever loaded (no GA4/Ads on the
 * project): `window.gtag` is undefined, the call is a no-op.
 *
 * ad_storage/ad_user_data/ad_personalization are granted only for the
 * "marketing" and "all" consent values, mirroring what the banner's
 * dedicated marketing/publicidade category actually discloses; they are
 * never granted just because analytics was accepted.
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

export function consentStateFor(consent: Consent): GtagConsentState {
  const analytics = hasAnalyticsConsent(consent);
  const marketing = hasMarketingConsent(consent);
  return {
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
    analytics_storage: analytics ? "granted" : "denied",
    functionality_storage: analytics ? "granted" : "denied",
    personalization_storage: analytics ? "granted" : "denied",
  };
}

export function applyGoogleConsentMode(consent: Consent) {
  window.gtag?.("consent", "update", consentStateFor(consent));
}
