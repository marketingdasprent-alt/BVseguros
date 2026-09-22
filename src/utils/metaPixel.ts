/**
 * Meta Pixel consent bridge, same shape as googleConsentMode.ts. The
 * base pixel code in index.html loads with `fbq('consent', 'revoke')`
 * immediately after init, so no event (not even the automatic
 * PageView) fires until this module grants consent. Safe to call even
 * when fbq never loads (no pixel ID set): `window.fbq` is undefined,
 * the call is a no-op.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function applyMetaPixelConsent(granted: boolean) {
  if (!window.fbq) return;
  if (granted) {
    window.fbq("consent", "grant");
    window.fbq("track", "PageView");
  } else {
    window.fbq("consent", "revoke");
  }
}
