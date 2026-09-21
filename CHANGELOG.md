# Changelog

All notable changes to Web Blueprint are documented here.
Format: `MAJOR.MINOR.PATCH`: see `BLUEPRINT.md#versioning`.

## [2.2.0]: 2026-09-18

### Added

- **`docs/lessons-learned.md`**: generalizable technical lessons from
  real projects built on this foundation (deployment/hosting gotchas,
  WCAG contrast-per-surface, i18n key-per-meaning, testing pitfalls,
  legal/compliance ordering, image pipeline, SEO checklist gaps),
  anonymized and stripped of any client-identifying or sensitive
  detail. Cross-referenced from `docs/agent-protocol.md` and
  `README.md`.
- **Security headers** subsection in `docs/performance.md`: the CSP
  `<meta>`-tag limitation (ignored by browsers for `frame-ancestors`/
  `X-Frame-Options`) and the "host config, not markup" rule.

## [2.1.0]: 2026-09-03

### Added

- **Google Consent Mode v2** (`src/utils/googleConsentMode.ts`): the
  existing `CookieConsent`/`useCookieConsent` now sends
  `gtag('consent', 'update', ...)` on every consent change and on mount,
  mapped from the two-tier model. The default-denied state ships in
  `index.html`, before any other script. Safe with no GA4/Ads loaded.
- **`LegalLayout`** (`src/components/layout/LegalLayout.tsx`): shared
  shell for legal pages (back link, title, last-updated date), plus
  `.legal-prose` styles in `components.css` for long-form legal text.
- **Legal page templates**, routed at `/privacy`, `/terms`, `/cookies`
  (`src/pages/legal/`): GDPR-shaped Privacy and Cookies structure, a
  generic Terms skeleton, and a "Manage cookie preferences" button
  wired to the existing `OPEN_PREFERENCES_EVENT`. Content is a bracketed
  placeholder, not reviewed legal text: see
  `docs/anti-ai.md#content-integrity`.
- `CookieConsent`'s preferences dialog now links to `/cookies` (closing
  the dialog before navigating). `navigation.ts`'s `legalNav` Privacy/
  Terms entries point at the new pages instead of `#`.

## [2.0.1]: 2026-09-03

### Added

- **`npm run qa`** (`scripts/qa-audit.mjs`): a dependency-free static
  audit covering the checkable subset of `docs/qa.md`: em-dash/banned
  phrases, hardcoded colors or `z-index` outside the token system,
  images without `alt`, more than one `<h1>` per page, missing favicon/
  robots.txt/sitemap/`og:image`, and unused dependencies. Complements,
  not replaces, the manual checklist in `docs/qa.md`.

## [2.0.0]: 2026-08-31

### Changed

- Migrated application source and Vite configuration to TypeScript with
  strict checking, typed native/polymorphic component props, DOM refs,
  navigation data, and cookie events. Imports must use the new extensions
  or extensionless paths. Invalid stored consent is treated as undecided.
- Added Tailwind CSS v4 through its Vite plugin, with `tw:` prefixed
  utilities and a theme bridge to the existing design tokens.
- CSS now uses explicit theme/base/components/utilities layers; existing
  component styles and the Blueprint reset remain. Tailwind Preflight is
  intentionally omitted. Laboratory blocks use real token-backed utilities.
- Added `typecheck` and `check` scripts. Production builds check types first.
- Updated the stack contract and migration guide (`docs/stack.md`).

## [1.2.0]: 2026-08-31

### Added

- **`CookieConsent`** (`src/components/feedback/`): consent banner
  (Accept all / Necessary only / Manage preferences) plus a native
  `<dialog>` preferences panel, backed by `useCookieConsent.js`. Two-tier
  consent model (`"necessary"` / `"all"`), `localStorage`-persisted and
  shared across every caller via `useSyncExternalStore` so any consumer
  (the banner, a reset control elsewhere) stays in sync in the same tab.
  See `docs/design-system.md#cookieconsent` and `DECISIONS.md`.
- **`BackToTop`** (`src/components/feedback/`): floating scroll-to-top
  control reusing `useScrollState`, respecting `prefers-reduced-motion`,
  hidden while the cookie banner is open or the footer is in view
  (`Footer` now runs an `IntersectionObserver` on itself for this).
- **Cross-component trigger pattern**: `useOpenCookiePreferences` /
  `OPEN_PREFERENCES_EVENT`, a `window` CustomEvent so `Footer`'s "Cookies"
  legal link can open `CookieConsent`'s dialog without prop-drilling or a
  Context provider. `navigation.js`'s `legalNav` entries can now declare
  `action` instead of `href`.
- **Full-bleed split section**: a documented composition pattern (media
  full-height on one side, measure-capped copy in a `Container` on the
  other), with a worked example on `/laboratory`. Not a new component:
  see `docs/design-system.md#full-bleed-split-section` and `DECISIONS.md`.
- **`docs/accessibility.md`**: guidance on using `:has(:focus-visible)`
  instead of `:focus-within` for a container whose activation target is a
  *nested* interactive element, to avoid a stuck-looking "selected" state;
  a contrast note on medium-lightness brand accents.
- **`docs/anti-ai.md`**: a concrete content-integrity case study.
- **`docs/agent-protocol.md`**: verify interactive CSS states via actual
  interaction/computed style, not a single static screenshot.
- **`docs/qa.md`**: checklist subsections for Cookie Consent and Back to Top.

## [1.1.0]: 2026-08-31

### Added

- **Global centering system**: `.section-intro` / `.section-intro--wide`,
  `.grid--center`, `.cluster--center`, and a `center` prop on `<Card />`.
  Structural elements (section openers, feature grids, button rows under
  a heading) center by default; body prose, lists, and forms stay
  left-aligned. See `docs/design-system.md#global-centering` and
  `DECISIONS.md`.
- **`docs/content-style.md`**: rules for avoiding AI-tell writing
  patterns (the em-dash as clause separator, "not X, it's Y", filler
  triplets, generic buzzwords), with concrete replacements.

### Fixed

- Removed every em-dash used as a clause separator across the codebase
  (140 occurrences) and the "not a template. It's the plumbing"
  rhetorical construction in `README.md`.
- Replaced the default create-vite favicon (a gradient blob) with a
  flat, on-brand mark.
- Removed the unloaded `"Inter"` claim from `--font-display`/
  `--font-body`: the tokens now name only fonts that are actually
  loaded (the system stack, by default).
- Reworked `Home.jsx`'s second section from a generic 3-card grid to a
  4-item stat row using real counts from the repository, resolving a
  contradiction with `docs/anti-ai.md`'s own guidance.

## [1.0.0]: 2026-08-31

Initial release.

### Added

- **Foundation**: Vite + React (JavaScript, no TypeScript), ESLint 9
  flat config with React/hooks/refresh rules.
- **Design tokens** (`src/styles/tokens.css`): color, typography
  (fluid `clamp()` scale), spacing, radius, shadows, z-index, motion,
  container widths, section rhythm.
- **CSS architecture**: `reset.css`, `global.css`, `typography.css`,
  `layout.css`, `components.css`, `utilities.css`, `responsive.css`,
  composed through `src/index.css`.
- **Layout primitives**: `<Container />`, `<Section />`.
- **Components**: `<Button />`, `<Input />`, `<Card />`, `<Header />`,
  `<Footer />`: each with a documented state contract in
  `docs/design-system.md`.
- **Minimal router**: `src/app/router.js` + `<Link />`, History-API
  based, no external routing dependency (see `DECISIONS.md`).
- **Pages**: `Home` (worked example), `Laboratory` (QA/validation
  surface at `/laboratory`).
- **Accessibility baseline**: skip link, `:focus-visible`, reduced
  motion, semantic nav landmarks, keyboard-operable header/menu.
- **Documentation**: `BLUEPRINT.md`, `MASTER-PROMPT.md`,
  `DECISIONS.md`, and `docs/{design-system,responsive,accessibility,
  anti-ai,agent-protocol,performance,qa}.md`.
