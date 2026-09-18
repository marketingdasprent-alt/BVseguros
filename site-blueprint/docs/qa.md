# QA Checklist

Run through this before considering a change (or a new project built
on the Blueprint) done. Not every item applies to every change: use
judgment on scope, but don't skip the ones that do apply.

`npm run qa` automates the subset of this checklist that is checkable
without a browser: em-dash/banned-phrase scans, hardcoded colors or
z-index outside the token system, images without `alt`, more than one
`<h1>` on a page, missing favicon/robots.txt/sitemap/og:image, and
dependencies declared but never imported. It complements this
checklist, not a replacement for the manual items below (responsive
breakpoints, keyboard traversal, cookie consent flow, contrast).

## Layout

- [ ] Every page width decision goes through `<Container />`: no
      section invents its own `max-width`.
- [ ] Vertical rhythm goes through `<Section />`: no arbitrary
      `padding-block`.
- [ ] No horizontal overflow at any viewport (`body` scrollbar stays
      vertical-only).
- [ ] Grids collapse sensibly at narrow viewports (no 12-column grid
      squeezing content at 320px).
- [ ] Structural elements (section openers, feature grids, button rows
      under a heading) are centered; body prose, lists, and forms are
      not (see `docs/design-system.md#global-centering`).

## Responsive

Validate at: 320, 375, 430, 768, 1024, 1280, 1440, 1920px.

- [ ] Type scales fluidly, no clipped/overlapping text at any width.
- [ ] Header nav collapses to the mobile menu below 1024px and back
      above it.
- [ ] Footer goes from stacked to multi-column at 768px.
- [ ] Images/media never overflow or distort.

## Navigation

- [ ] All Header links resolve (internal routes navigate, anchors
      scroll, external links open correctly).
- [ ] `aria-current="page"` reflects the actual current route.
- [ ] Mobile menu opens, closes on link click, closes on `Escape`.
- [ ] Full keyboard traversal: Tab through Header → main content →
      Footer without a dead end or trap.

## Components: states

- [ ] Button: default, hover, focus-visible, active, disabled, loading
      all visually distinct.
- [ ] Input: default, hover, focus, error (with message), success
      (with message), disabled.
- [ ] Card: default, hover (if interactive), focus-visible (if
      interactive), selected (if applicable).

## Cookie consent

- [ ] Banner shows on first visit only; button order is Accept all,
      Necessary only, then Manage preferences full-width below.
- [ ] Accept all / Necessary only both dismiss the banner and persist
      across a reload.
- [ ] Manage preferences opens the native dialog from the banner, and
      separately from the footer's "Cookies" link, on any page.
- [ ] The necessary category shows as checked and disabled; the optional
      category is a real, labeled checkbox.
- [ ] `Escape`, the close button, and Save all close the dialog and
      return focus to whatever opened it.
- [ ] Resetting consent (Laboratory has a control for this) re-shows the
      banner without a manual `localStorage` edit.

## Back to top

- [ ] Hidden above the scroll threshold, appears past it.
- [ ] Scrolls smoothly by default, instantly under emulated
      `prefers-reduced-motion: reduce`.
- [ ] Hidden while the cookie consent banner is open (no overlap).
- [ ] Hidden while the footer is in view (no overlap with footer content).

## Forms

- [ ] Every input has a visible, associated `<label>`.
- [ ] Error/success states are conveyed by more than color alone.
- [ ] Keyboard-only form completion works end to end.

## Content

- [ ] No placeholder copy that reads as real (unlabeled Lorem Ipsum,
      fake testimonials/stats: see `docs/anti-ai.md#content-integrity`).
- [ ] No em-dash used as a clause separator, and no other pattern from
      `docs/content-style.md` (`grep -rn "—" src docs *.md` returns
      nothing).
- [ ] No broken links or dead anchors.
- [ ] No duplicated content between sections.
- [ ] Language is consistent throughout (no mixed pt-PT/pt-BR/EN: see
      `MASTER-PROMPT.md` §24).

## Technical

- [ ] `npm run lint` passes clean.
- [ ] `npm run typecheck` passes, including component type-contract tests.
- [ ] Tailwind examples in Laboratory resolve token-backed colors/spacing.
- [ ] No console errors or warnings in the browser.
- [ ] No missing assets (broken image/icon requests).
- [ ] No duplicate `id` attributes on the page.
- [ ] No unused dependencies in `package.json`.
- [ ] `npm run build` completes without warnings worth investigating.
- [ ] No layout shift (CLS) from late-loading images/fonts/embeds.
