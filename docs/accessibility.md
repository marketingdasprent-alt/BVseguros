# Accessibility Baseline

## Principles

- Semantic HTML first. Reach for `<button>`, `<a>`, `<nav>`, `<label>`
  before `<div>` + ARIA. ARIA is a patch for when semantic HTML can't
  express the interaction, not a default.
- One `<h1>` per page (see `MASTER-PROMPT.md` §19), and headings step
  down in order (`h1` → `h2` → `h3`): don't skip levels for visual
  sizing; use `.text-*` utility classes for that instead.
- Every interactive element must be reachable and operable by keyboard
  alone, with a visible focus state.

## What's implemented

- **`:focus-visible`**: a single global rule in `global.css` (2px
  outline using `--color-focus-ring`) so every interactive element gets
  a consistent, visible focus ring without per-component overrides.
- **Skip link**: `.skip-link` in `App.tsx`, jumps to `#main-content`,
  visually hidden until focused.
- **Reduced motion**: `reset.css` collapses all animation/transition
  durations under `prefers-reduced-motion: reduce`.
- **Header**: `nav` elements carry `aria-label` ("Primary" /
  "Mobile"); the current route gets `aria-current="page"`; the mobile
  toggle has `aria-expanded` + `aria-controls` + a dynamic
  `aria-label`; the menu closes on `Escape`.
- **Button**: `aria-busy` while loading; `aria-disabled` (rather than
  the native `disabled` attribute) when rendered as a non-`<button>`
  element, so it stays in the tab order and announces correctly.
- **Input**: `<label htmlFor>` is always paired via `useId()`;
  `aria-invalid` on error; `aria-describedby` links the status message.
- **Card**: `interactive` cards get `tabIndex={0}` and
  `role="button"` so they're keyboard-reachable; don't make a card
  interactive unless it has a single, clear activation action (prefer
  an actual link/button inside it when possible).
- **CookieConsent**: the preferences panel is a native `<dialog>`
  (focus trap and top-layer stacking come from the browser, not custom
  JS); `Escape`, the close button, and Save all route through the
  dialog's native `close` event so there's one exit path to keep in
  sync, and focus returns to whatever element opened it. The optional
  category is a plain `<input type="checkbox">` paired with a real
  `<label>` via `useId()`; the necessary category is `checked disabled`
  rather than hidden, so its state is still announced.

**If a card (or any container) composes a *nested* link/button as its
activation target instead of being directly interactive itself**, don't
drive its "active/selected" outline with `:focus-within`: that pseudo-class
also matches after a plain mouse click leaves the nested element focused,
so the highlight can look permanently "stuck on" one item instead of
reflecting real keyboard focus. Use `:has(:focus-visible)` on the container
instead, which only matches when the browser itself would show a focus
indicator. This doesn't apply to this Blueprint's own `Card`, which is
directly focusable (`role="button"`, no nested interactive element), only
to a composition that wraps one.
- **Target size**: every interactive control (`.btn`, `.field__control`,
  `.header__toggle`) has a `min-height` of at least 2.25rem (36px),
  most at 2.75rem (44px).

## Contrast

Placeholder token values in `tokens.css` were chosen to meet WCAG AA
for body text against their paired surface. **Re-verify contrast after
swapping in a project's real palette**: token names don't guarantee
contrast, only structure does.

Pay particular attention to a brand accent in the medium-lightness band
(a mid-tone green or teal is the common case): both a dark and a light
text color can look plausible on it at a glance, but only one of them
actually clears WCAG AA, and picking the wrong one by eye is an easy
mistake to ship. Run the actual pair through a contrast checker; don't
decide by looking at it on a bright monitor.

## Forms

- Always pair a visible `<label>`, not a placeholder-only field.
- Error and success states must change more than color: `Input`
  additionally renders a text message (`.field__message`) and sets
  `aria-invalid`, so the state doesn't rely on color perception alone.

## Checklist for new components

1. Can it be built with a native semantic element? Use that first.
2. Does every state (hover/focus/active/disabled/error/…) have a
   non-color-only signal available?
3. Is it operable with keyboard only: tab to it, activate with
   Enter/Space, escape a panel with `Escape`?
4. Did you add `aria-*` only where semantic HTML can't express the
   state (don't add `role="button"` to an actual `<button>`)?
