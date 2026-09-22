import { useCallback, useEffect, useSyncExternalStore } from "react";
import { applyGoogleConsentMode } from "../utils/googleConsentMode";
import { applyMetaPixelConsent } from "../utils/metaPixel";

const STORAGE_KEY = "blueprint_cookie_consent";
const CONSENT_VALUES = ["necessary", "analytics", "marketing", "all"] as const;
export type Consent = (typeof CONSENT_VALUES)[number];
export type CookiePreferencesEvent = CustomEvent<{ trigger?: HTMLElement } | undefined>;

declare global {
  interface WindowEventMap {
    "blueprint:open-cookie-preferences": CookiePreferencesEvent;
  }
}

/**
 * Three-tier consent model: "necessary" plus two independent optional
 * categories, analytics (GA4) and marketing (Meta Pixel), stored as one
 * of "necessary" / "analytics" / "marketing" / "all" rather than a
 * granular per-vendor CMP. Grew from the original two-tier model
 * ("necessary" | "all", see DECISIONS.md) specifically because
 * marketing/ad tracking is not the same consent category as analytics
 * (docs/anti-ai.md, src/utils/googleConsentMode.ts): once a project's
 * actual integrations include an ads pixel, silently folding it into
 * "analytics" consent would misrepresent what the visitor agreed to.
 *
 * Consent is module-level shared state (via useSyncExternalStore), not
 * per-call useState: CookieConsent and any other consumer (the
 * Laboratory's reset control, a settings page) must all see the same
 * value and re-render when one of them changes it, in the same tab,
 * without a page reload.
 */
export function hasAnalyticsConsent(consent: Consent): boolean {
  return consent === "analytics" || consent === "all";
}

export function hasMarketingConsent(consent: Consent): boolean {
  return consent === "marketing" || consent === "all";
}

export function consentFrom(analytics: boolean, marketing: boolean): Consent {
  if (analytics && marketing) return "all";
  if (analytics) return "analytics";
  if (marketing) return "marketing";
  return "necessary";
}

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return (CONSENT_VALUES as readonly string[]).includes(value ?? "")
      ? (value as Consent)
      : null;
  } catch {
    return null;
  }
}

let consentValue = readConsent();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return consentValue;
}

export default function useCookieConsent() {
  const consent = useSyncExternalStore(subscribe, getSnapshot);

  // Re-sends the Consent Mode v2 / Meta Pixel consent signal on every
  // load for a returning visitor: both default to denied/revoked each
  // page load until this runs, neither is persisted by the vendor itself.
  useEffect(() => {
    if (!consent) return;
    applyGoogleConsentMode(consent);
    applyMetaPixelConsent(hasMarketingConsent(consent));
  }, [consent]);

  const setConsent = useCallback((value: Consent) => {
    consentValue = value;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Consent still works for this visit when storage is unavailable. */
    }
    notify();
  }, []);

  const clearConsent = useCallback(() => {
    consentValue = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Nothing to clean up if storage was never available. */
    }
    notify();
  }, []);

  return { consent, setConsent, clearConsent };
}

/**
 * Cross-component trigger for opening the preferences dialog from
 * anywhere (a footer link, a settings page) without prop-drilling or a
 * Context provider for what is a rare, one-way signal. See DECISIONS.md.
 */
export const OPEN_PREFERENCES_EVENT = "blueprint:open-cookie-preferences";

export function useOpenCookiePreferences(handler: (event: CookiePreferencesEvent) => void) {
  useEffect(() => {
    window.addEventListener(OPEN_PREFERENCES_EVENT, handler);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handler);
  }, [handler]);
}
