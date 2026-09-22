import useScrollState from "../../hooks/useScrollState";

const VISIBILITY_THRESHOLD: number = 480;

/**
 * Floating back-to-top control. Reuses useScrollState (the same hook
 * Header uses for its own scroll threshold) instead of a second,
 * bespoke scroll listener. See docs/design-system.md#backtotop.
 */
export default function BackToTop() {
  const visible = useScrollState(VISIBILITY_THRESHOLD);

  if (!visible) return null;

  const handleClick = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
  };

  return (
    <button
      type="button"
      className="back-to-top"
      onClick={handleClick}
      aria-label="Voltar ao topo"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V4M5 11l7-7 7 7" />
      </svg>
    </button>
  );
}
