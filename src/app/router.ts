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
  // that also changes page is handled by useScrollToHashOnNavigate,
  // after the new page commits: scrolling here could hit an element
  // with the same id on the page that is about to unmount.
  if (samePage) document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
}

/** Call once in App with the current pathname. */
export function useScrollToHashOnNavigate(pathname: string) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
  }, [pathname]);
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
