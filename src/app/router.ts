import { useEffect, useState } from "react";

/**
 * Minimal history-based router. A dependency like react-router isn't
 * justified for two routes (see MASTER-PROMPT.md tech-stack rules).
 * This is the smallest thing that lets Header/Footer links and the
 * browser back/forward button work correctly.
 */

const listeners = new Set<() => void>();

export function navigate(to: string) {
  const hashIndex = to.indexOf("#");
  const path = hashIndex === -1 ? to : to.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : to.slice(hashIndex + 1);
  const samePage = path === window.location.pathname;

  if (samePage && !hash) return;

  window.history.pushState({}, "", to);
  if (!samePage) listeners.forEach((notify) => notify());

  if (!hash) {
    if (!samePage) window.scrollTo(0, 0);
    return;
  }

  // Same-page hash: the target is already mounted, scroll now. A hash
  // that also changes page has to wait a tick for the new page (and the
  // target element) to mount first.
  const scrollToHash = () =>
    document.getElementById(hash)?.scrollIntoView({ behavior: samePage ? "smooth" : "auto" });
  if (samePage) scrollToHash();
  else requestAnimationFrame(scrollToHash);
}

export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onChange = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onChange);
    listeners.add(onChange);
    return () => {
      window.removeEventListener("popstate", onChange);
      listeners.delete(onChange);
    };
  }, []);

  return pathname;
}
