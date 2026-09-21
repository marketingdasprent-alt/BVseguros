import { useCallback, useEffect, useSyncExternalStore } from "react";
import { applyGoogleConsentMode } from "../utils/googleConsentMode";

const STORAGE_KEY = "blueprint_cookie_consent";
export type Consent = "necessary" | "all";
export type CookiePreferencesEvent = CustomEvent<{ trigger?: HTMLElement } | undefined>;

declare global {
  interface WindowEventMap {
    "blueprint:open-cookie-preferences": CookiePreferencesEvent;
  }
}

/**
 * Two-tier consent model: "necessary" (optional categories declined) or
 * "all" (optional categories accepted). Not a granular multi-category CMP:
 * see DECISIONS.md for why that scope was deliberately left out.
 *
 * Consent is module-level shared state (via useSyncExternalStore), not
 * per-call useState: CookieConsent and any other consumer (the
 * Laboratory's reset control, a settings page) must all see the same
 * value and re-render when one of them changes it, in the same tab,
 * without a page reload.
 */
function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "necessary" || value === "all" ? value : null;
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

  // Re-sends the Consent Mode v2 signal on every load for a returning
  // visitor: gtag's default (denied) state resets each page load until
  // this runs, it isn't persisted by Google itself.
  useEffect(() => {
    if (consent) applyGoogleConsentMode(consent);
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
