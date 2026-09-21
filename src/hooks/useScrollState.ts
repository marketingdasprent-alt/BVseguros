import { useEffect, useState } from "react";

/**
 * Tracks whether the page has scrolled past `threshold` px. Used by
 * Header to toggle its solid/transparent and shadow states.
 */
export default function useScrollState(threshold: number = 8) {
  const [scrolled, setScrolled] = useState(
    typeof window !== "undefined" ? window.scrollY > threshold : false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
