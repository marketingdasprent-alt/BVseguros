# Responsive Strategy

## Philosophy

Fluid first, discrete second. Most of the system scales continuously
via `clamp()`/`minmax()`/`auto-fit` in `tokens.css` and `layout.css`:
type, spacing, section padding, container gutters, card grids. A media
query in `responsive.css` is for the minority of cases where the layout
genuinely needs to change *shape*, not just *size*: the header nav
collapsing into a menu, the footer going from 1 to 4 columns.

Before adding a media query, ask: is this value actually discrete, or
did I just not reach for `clamp()`/`minmax()` first?

## QA validation points

These are checkpoints to verify at, not a mandate to add a breakpoint
at each one:

| Width | Represents |
|---|---|
| 320px | Smallest mobile |
| 375px | Mobile |
| 430px | Mobile large |
| 768px | Tablet |
| 1024px | Tablet landscape / laptop |
| 1280px | Desktop |
| 1440px | Desktop large |
| 1920px | Ultrawide-adjacent |

## Rules

1. **No horizontal overflow, ever.** `reset.css` sets `overflow-x:
   hidden` on `body` as a safety net; treat any content that requires
   it as a bug to fix at the source (an unconstrained fixed-width
   element, a missing `max-width: 100%` on media), not a reason to lean
   on the safety net.
2. **Text never needs a horizontal scrollbar.** `p` is capped at `70ch`
   in `typography.css` so line length stays readable at ultrawide
   without a per-page fix.
3. **Wide content (tables, code, diagrams) scrolls in its own
   container**, not the page: give it `overflow-x: auto`.
4. **Shared component breakpoints live in `responsive.css`.** Local Tailwind
   compositions may use the named responsive variants in `docs/stack.md`.
   Don't scatter
   `@media` blocks across component files; it becomes impossible to see
   the full responsive picture. Component `.css` blocks in
   `components.css` hold the non-responsive state styles.
5. **Mobile menu, not squeezed desktop nav.** Below 1024px the header
   nav collapses into `.header__toggle` rather than shrinking font size
   or wrapping links: see `Header.tsx`.
