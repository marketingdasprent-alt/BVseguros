# Design System Reference

This is the token and component contract for Web Blueprint. It documents
*what exists and why*, not how to make a specific page look a specific
way: that's Creative Direction (see `MASTER-PROMPT.md` §35).

## Token levels

Tokens live in `src/styles/tokens.css` as CSS Custom Properties on `:root`.
The **names** are Level 1 (immutable: components are written against
them). The **values** are Level 2 (project-configurable: replace them
per project without touching a single component).

### Color

| Token | Role |
|---|---|
| `--color-background` | Page background |
| `--color-surface` | Default component surface (cards, inputs) |
| `--color-surface-alt` | Secondary surface, `Section surface` background |
| `--color-border` / `--color-border-strong` | Hairline / emphasized borders |
| `--color-text-primary` / `-secondary` / `-muted` | Text hierarchy |
| `--color-text-on-primary` / `-on-dark` | Text over filled/dark surfaces |
| `--color-primary` / `-hover` / `-active` | Brand action color + interaction states |
| `--color-secondary`, `--color-accent` | Secondary brand roles |
| `--color-success` / `-warning` / `-error` (+ `-surface` pairs) | Feedback states |
| `--color-focus-ring` | `:focus-visible` outline color |

Components consume **semantic** tokens only (`--color-primary`,
`--color-text-secondary`, …), never the raw `--color-neutral-*` ramp
directly. This is what lets a project reassign the whole palette by
editing one file.

### Typography

`--font-display`, `--font-body`, `--font-mono`: family tokens.
`--font-size-display` through `--font-size-caption`: a fluid scale
built with `clamp()`; every step scales with the viewport without a
media query. `--font-weight-*` and `--line-height-*` round out the set.

### Spacing

`--space-3xs` (4px) through `--space-3xl` (fluid, ~144px at max viewport).
A single scale used everywhere: component padding, section rhythm,
gaps. If a value isn't on this scale, that's a signal to either use the
nearest step or add a genuinely new step to the scale (with a reason in
`DECISIONS.md`), never a one-off literal.

### Radius, shadows, z-index, motion, containers

See `tokens.css` directly: each is a short, fully-commented scale.
Notably: `--z-*` is the **only** place a z-index value should come from
(no ad-hoc `z-index: 999`), and `--container-narrow/standard/wide` back
the `<Container />` variants below.

## Layout primitives

### `<Container />`

`src/components/layout/Container.tsx`. Controls max-width, centering,
and horizontal gutter. The only place page width should be decided.

```jsx
<Container variant="narrow" | "standard" (default) | "wide" | "full">
```

### `<Section />`

`src/components/layout/Section.tsx`. Controls vertical rhythm between
page blocks, and optionally a full-bleed background (`surface`) while
content stays aligned via a nested `<Container />`.

```jsx
<Section variant="compact" | "normal" (default) | "spacious" | "immersive" surface={boolean}>
```

## Global centering

Adopted as a deliberate Level 1 rule (`DECISIONS.md`), not a default
nobody chose: structural elements center by default, body prose does
not.

**Centered by default:** section openers (label + heading + lede),
feature/value-prop grids and the items inside them, button rows that
sit under a centered heading.

**Left-aligned always, regardless of Section:** paragraphs of running
body copy, list content, form fields, card content that's genuinely
prose (a testimonial quote, an article excerpt).

The reasoning: a centered heading over a left-aligned wall of body text
reads as broken symmetry. A centered paragraph of real body copy is
harder to read at any length past a line or two. Splitting the rule
this way keeps both intact.

**How to apply it:**

- Open a `<Section>` with `.section-intro` (`.section-intro--wide` for
  a longer lede): a flex column, centered, capped at `--measure-intro`
  so centered text doesn't sprawl edge to edge. See `src/pages/Home.tsx`
  for the pattern in use.
- Add `.cluster--center` to a `.cluster` button row to center it under
  a centered heading.
- Add `.grid--center` to `.grid`/`.grid-auto` to center a feature grid
  as a whole and its items' internal content.
- Pass `center` to `<Card />` for a centered card (icon/number + short
  label, not prose).
- Everything else (an `<Input>`, a `<p>` of real body copy, a list)
  stays left-aligned by not opting into any of the above.

## Components

### Button: `src/components/ui/Button.tsx`

Variants: `primary` (default) / `secondary` / `ghost`. `size="sm"` for
a compact button. `loading` and `disabled` are mutually exclusive-ish
(loading implies disabled interaction).

**States implemented:** default, hover, `:focus-visible`, active,
disabled, loading (spinner + `aria-busy`).

### Input: `src/components/forms/Input.tsx`

A labeled text field with an optional status message.
`status="error" | "success"` drives both the border color and the
message color; `aria-invalid` / `aria-describedby` are wired
automatically.

**States implemented:** default, hover, focus, error, success, disabled.
("Filled" is a browser-native visual state: no extra class needed.)

### Card: `src/components/ui/Card.tsx`

A generic content surface. `interactive` adds hover/focus elevation and
makes it keyboard-focusable (`tabIndex`, `role="button"` by default,
override via props); `selected` adds a persistent selected border;
`center` centers the card's internal content (see Global centering
above, for stat/value-prop style cards, not prose cards).

**States implemented:** default, hover, `:focus-visible`, selected.

### Header: `src/components/navigation/Header.tsx`

Sticky bar backed by `useScrollState` (adds `.header--scrolled` past an
8px scroll threshold, for a shadow/border transition). `transparent`
prop starts the header see-through until scrolled. Renders a `cta`
button slot, and collapses `primaryNav` (from `src/data/navigation.ts`)
into a toggled mobile panel below 1024px, closing on route change and
on `Escape`.

### Footer: `src/components/layout/Footer.tsx`

Branding block, up to N nav columns (from `footerNav` in
`src/data/navigation.ts`), social links, and a bottom bar with
copyright + legal links. Single column on mobile, multi-column ≥768px.

### CookieConsent: `src/components/feedback/CookieConsent.tsx`

A consent banner plus a native `<dialog>` preferences panel, rendered once
globally (`App.tsx`). Two-tier model only, `"necessary"` or `"all"`: not a
granular multi-category CMP (see `DECISIONS.md` for why that scope was
deliberately left out; add categories only when a real integration needs
them).

**Button hierarchy is deliberate**: Accept all (`primary`) and Necessary
only (`secondary`) share a row; Manage preferences (`ghost`, full width) sits
below on its own. Don't reorder this without a reason: it exists so the
optional-cookie decision isn't buried and the neutral path isn't visually
dominant.

**Opening the dialog from elsewhere** (a footer link, a settings page): don't
prop-drill or add a Context provider for what is a rare, one-way signal.
Dispatch `window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT, {
detail: { trigger: el } }))` (both exported from
`src/hooks/useCookieConsent.ts`); `CookieConsent` listens globally. `el` is
optional and, when passed, gets focus back once the dialog closes. See
`Footer.tsx`'s "Cookies" legal link for the reference implementation, and
`navigation.ts`'s `legalNav`: an entry can declare `action: "cookie-preferences"`
instead of `href` to opt into this.

**States implemented:** banner visible/hidden, dialog open/closed
(`Escape`, the close button, and Save all route through the native `close`
event so there is exactly one exit path to keep in sync), optional-category
checked/unchecked.

**Copy is a placeholder.** Replace `COPY` in `CookieConsent.tsx` with the
project's real cookie categories and legal text before shipping (see
`docs/anti-ai.md#content-integrity`): the strings there describe a generic
necessary/analytics split, not this project's actual data processing.

**Google Consent Mode v2** (`src/utils/googleConsentMode.ts`): every
`setConsent` call, and every mount of a component that calls
`useCookieConsent()`, sends `gtag('consent', 'update', ...)` mapped from
the two-tier model (`"necessary"` denies every category, `"all"` grants
`analytics_storage`/`functionality_storage`/`personalization_storage`
only, never `ad_*`: this banner never asks for ad consent). The
default-denied state lives in `index.html`, before any other script, so
it applies even on a project with no GA4/Ads account yet. Calling this is
always safe: it no-ops when `window.gtag` doesn't exist. See
`DECISIONS.md` for why `ad_*` staying denied is deliberate.

### LegalLayout: `src/components/layout/LegalLayout.tsx`

Shared shell for legal pages (`src/pages/legal/{Privacy,Terms,Cookies}.tsx`,
routed at `/privacy`, `/terms`, `/cookies`). `Header`/`Footer` already wrap
every route in `App.tsx`, so this only owns a page-local back link, `<h1>`
title, and last-updated date, via `Container variant="narrow"` +
`Section`. Page content renders inside `.legal-prose` (`components.css`),
which caps measure at 70ch and styles `h2`/`p`/`ul`/`strong`/`a` for
long-form legal text, distinct from marketing copy's typography.

**The three page templates are section skeletons, not reviewed legal
text.** Privacy and Cookies follow a real GDPR-shaped structure (data
controller, purposes and legal basis, retention, data-subject rights,
international transfers for Privacy; categories, Consent Mode v2, and a
"Manage cookie preferences" button dispatching `OPEN_PREFERENCES_EVENT`
for Cookies); Terms is a generic skeleton since terms are inherently
specific to what a business sells. Every bracketed value
(`[COMPANY NAME]`, `[DATE]`, …) must be replaced with the project's real
facts before shipping (`docs/anti-ai.md#content-integrity`); don't publish
with brackets still in place, and don't treat the structure itself as a
substitute for actual legal review in the project's jurisdiction.

### BackToTop: `src/components/feedback/BackToTop.tsx`

A floating scroll-to-top control, rendered once globally. Reuses
`useScrollState(threshold)`, the same hook `Header` uses for its own
scroll-position detection, at a larger threshold (480px) instead of a second
bespoke scroll listener. Respects `prefers-reduced-motion` for the scroll
itself (instant vs. smooth), checked at click time via `matchMedia`.

Deliberately icon-only: an arrow, no circle/square backdrop. Hides while
`CookieConsent`'s banner is open (`body.has-cookie-banner`) and while the
`Footer` is in view (`body.has-footer-visible`, toggled by an
`IntersectionObserver` `Footer` runs on itself): both are documented
CSS-only coordination points, see `DECISIONS.md`. A fixed bottom-right
control will otherwise end up sitting on top of the footer's own
bottom-right content once the page is scrolled all the way down.

**States implemented:** hidden (above threshold), visible, hover, hidden
while the cookie banner is open, hidden while the footer is in view.

## Full-bleed split section (composition pattern, not a component)

A section with media running the full section height on one side and copy
on the other, with no gutter on the media side. This is deliberately *not* a
new mandatory component: it's a two-line deviation from the normal
`Section > Container` nesting, and forcing it into a component would hide
that it's just `Container` placement, not a new primitive.

```jsx
<Section className="my-split-section">
  {/* No Container: this reaches the section's actual edge. */}
  <img src="…" alt="…" className="my-split-section__media" />

  <Container variant="narrow" className="my-split-section__copy">
    <h2>Heading</h2>
    <p>Copy stays measure-capped even though the media doesn't.</p>
  </Container>
</Section>
```

```css
.my-split-section {
  display: grid;
  grid-template-columns: 1fr 1fr; /* project-specific ratio, e.g. 55/45 */
  align-items: stretch;
  padding-block: 0; /* let the media reach the section's top/bottom edge */
}

.my-split-section__media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.my-split-section__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-block: var(--section-padding-normal);
}

@media (max-width: 768px) {
  .my-split-section {
    grid-template-columns: 1fr; /* stack: media above copy, full width */
  }
}
```

See the Laboratory (`/laboratory`) for a scaled-down version of this same
structure (nested inside a `Container` there for QA convenience, since
breaking out of the Laboratory's own page container would look broken on a
docs/QA page rather than demonstrate the pattern).

## Not yet implemented

Select, Checkbox, Radio, Accordion, Modal, Tabs, Carousel, Breadcrumb,
Alert, Tooltip, Badge. Per `MASTER-PROMPT.md` §14/§36, v1.0.0 proves the
architecture rather than pre-building every component. Add one when a
real page needs it: reuse the token set and the state-contract pattern
above (default/hover/focus/active/disabled at minimum for anything
interactive) rather than inventing a new pattern per component.

`CookieConsent` uses a native `<dialog>` and a plain `<input type="checkbox">`
internally rather than waiting on formal `Modal`/`Checkbox` components: both
stay local, undocumented markup inside that one component. Don't treat this
as those components existing; build `Modal`/`Checkbox` properly, with their
own contract here, the day another feature actually needs a reusable one.
