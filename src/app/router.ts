import { useEffect, useState } from "react";

/**
 * Minimal history-based router. A dependency like react-router isn't
 * justified for two routes (see MASTER-PROMPT.md tech-stack rules).
 * This is the smallest thing that lets Header/Footer links and the
 * browser back/forward button work correctly.
 */

const listeners = new Set<() => void>();

export function navigate(to: string) {
  if (to === window.location.pathname) return;
  window.history.pushState({}, "", to);
  listeners.forEach((notify) => notify());
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
