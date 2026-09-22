# Decision Log

Structural decisions, and documented rule-breaks (overrides), in
chronological order.

Current stack note (v2.0.0): the historical JavaScript-only decision below
is superseded by the TypeScript/Tailwind migration entry. Historical paths
remain as recorded; application files now use `.ts` / `.tsx`.

---

```
PROJECT DECISION (BV Seguros):
Added public/images/logo-icon-bv-seguros.png: a tight crop of just
the shield mark, cut from the full "shield + BV Seguros + Seguros e
Soluções" lockup. Header.tsx and index.html's favicon link now point
to it instead of the full lockup image.

REASON:
Two earlier passes at this same logo (transparent background, then
edge decontamination) both missed the actual bug, flagged a third
time by the client. The file was never just an icon: it is the full
lockup (shield + two lines of wordmark) on one canvas. Squeezed into
a 28x28 box (object-fit: contain), the wordmark rendered as an
illegible smudge under the shield, which is what looked like a
leftover "box" behind it. The background-transparency fixes were
real and correct, but they could never fix this, because the
remaining artefact was compressed text, not a background colour.

SCOPE:
public/images/logo-icon-bv-seguros.png (new file, cropped from the
already-transparent public/images/logo-bv-seguros.png), src/
components/navigation/Header.tsx (one src attribute), index.html
(favicon href). brand/logo-bv-seguros.png and public/images/logo-bv-
seguros.png keep the full lockup (shield + wordmark): still correct
for anywhere the full brand mark is wanted, just not a 28px square.

IMPACT:
No component contract changed. If the full lockup is ever needed
somewhere else on the site, it is still at its original path; this
only redirects the two places that actually wanted the icon alone.

DATE:
2026-09-22
```

---

```
PROJECT DECISION (BV Seguros):
Logo asset (brand/logo-bv-seguros.png and public/images/logo-bv-
seguros.png) had its background pixels made transparent (a Python/
Pillow script keyed out the near-uniform #F7F7F7 background, with a
feathered edge to avoid jagged anti-aliasing artefacts). Buttons
switched from --radius-md to --radius-full (pill shape). Home.tsx
restructured: Hero illustration replaced with a real photo + a
floating info card overlapping it; a new middle-inverted 3-card
"spotlight" row (.spotlight-card) added right after the Hero, using
content that used to live in a since-removed "Porquê a BV" split-
section; "O que cobrimos" icons moved into a colour-chip badge
(.media-card__icon-chip).

REASON:
Logo: the PNG's opaque grey canvas was showing as a visible box
against the white header, flagged directly. Buttons/spotlight-card/
icon-chip: the client shared two reference sites (a finance-advisory
site and a digital-agency site) and asked for their visual elements.
Adopted: pill buttons, a real hero photo with a floating trust card,
and a middle-inverted 3-card row, all present on the finance-advisory
reference (the closer match: same professional-services category).
Deliberately not adopted: the agency reference's purple gradient and
glassmorphism (docs/anti-ai.md names that exact look as a default to
avoid) and any fabricated stat/rating badge (neither reference's
numbers are ours to reuse; see docs/anti-ai.md#content-integrity).

SCOPE:
brand/ and public/images/ logo files (pixel edit only, not
regenerated), src/styles/components.css (.btn radius; new .hero-
photo, .hero-floating-card*, .spotlight-card*, .media-card__icon-chip
blocks, all additive), src/pages/Home.tsx (Hero markup, new spotlight
section, removed split-section "Porquê a BV", icon-chip markup).

IMPACT:
Button.tsx itself untouched (only its CSS radius token changed, so
every button site-wide picked up the pill shape automatically). The
"Porquê a BV" anchor (id="porque") now lives on the new spotlight
section, nav link unaffected. The `porque-bv.jpg` photo now serves
double duty (Hero here; no other section referenced it after the
split-section's removal).

DATE:
2026-09-21
```

---

```
PROJECT DECISION (BV Seguros):
Hero Section given a navy (--color-primary) background via a scoped
.hero-dark class, instead of white like the rest of the page. Text,
HeroMark illustration and both buttons get scoped overrides
(.hero-dark ...) for contrast on the dark surface: no new component
variant added to Button or Section themselves.

REASON:
Direct client feedback ("quebra de coloração"): the page read as
white-on-white past the header with no visual anchor at the top.

SCOPE:
src/pages/Home.tsx (Section className, HeroMark colors switched from
--color-primary/--color-accent to --color-text-on-dark), src/styles/
components.css (.hero-dark block, additive, all under one selector
prefix). Button.tsx and Section.tsx unchanged; every other Section on
the page is unaffected.

IMPACT:
Any future dark-background Section can reuse this exact pattern
(scoped class overriding text/button colors) instead of inventing a
new one; Button/Section keep a single light-surface-only contract.

DATE:
2026-09-21
```

---

```
PROJECT DECISION (BV Seguros):
Added stock photography (Pexels, free commercial-use license) to
"O que cobrimos" (one photo per ramo, via a new .media-card pattern)
and to "Porquê a BV Seguros" (a full-bleed split section, image one
side, copy the other). Also fixed .footer__columns, which hardcoded
grid-template-columns: repeat(4, 1fr) and left visible dead space
when a project (like this one) only defines 2 nav columns: changed
to repeat(auto-fit, minmax(8rem, 1fr)).

REASON:
Direct client feedback: the homepage read as too plain/empty, and
"Porquê a BV Seguros" specifically as bare enough to be
counter-productive. None of these photos are of the real BV Seguros
(office, staff, clients): same placeholder convention as
AbreuEPereira's stock photography, disclosed in the code comment
next to the RAMOS data and never presented as real company photos.

SCOPE:
src/pages/Home.tsx (RAMOS gains an `imagem` field, "O que cobrimos"
and "Porquê a BV" markup), src/styles/components.css (new
.media-card and .split-section rules, additive), src/styles/
responsive.css (.footer__columns fix, Level 1 file but a scoped,
justified bug fix, not a design change), public/images/ramos/*.jpg
and public/images/porque-bv.jpg (new assets).

IMPACT:
Container/Section/Button/Input/Header contracts unchanged. Footer's
fix is backward compatible: repeat(auto-fit, minmax(8rem, 1fr)) still
produces 4 even columns when a project defines 4, same as before.

DATE:
2026-09-21
```

---

```
PROJECT DECISION (BV Seguros):
Neutral color ramp replaced with a cool gray-blue scale (Tailwind's
"slate" values) instead of the foundation's default warm gray, and
--font-display/--font-body switched from system-ui to Plus Jakarta
Sans + Inter (Google Fonts, font-display: swap, preconnect in
index.html).

REASON:
The warm/olive-tinted default neutral ramp clashed with the brand navy
(#184070, from the confirmed logo). A cool ramp sits next to it without
fighting it. The webfont swap matches the typography already used in
the BV Seguros CRM (../crm/) and the original vanilla site (../), so
all three surfaces read as the same brand instead of three unrelated
projects. Per MASTER-PROMPT.md, this is expected Level 2 (token value)
customization, not a Level 1 override.

SCOPE:
src/styles/tokens.css (color ramp, --color-primary/-hover/-active,
--font-display, --font-body), index.html (font preconnect/link tags).
Token *names* and every component contract are unchanged.

IMPACT:
Container/Section/Button/Card/Input/Header/Footer/CookieConsent code is
untouched; they pick up the new values automatically because they only
ever reference token names.

DATE:
2026-09-18
```

---

```
PROJECT DECISION (BV Seguros):
Added a `.placeholder-note` utility (components.css) reusing the
existing --color-warning / --color-warning-surface tokens, plus a
local `PorConfirmar` wrapper in Home.tsx, instead of inventing new
colors for "content not confirmed yet" markers.

REASON:
docs/anti-ai.md#content-integrity requires placeholders to be visibly
marked, not disguised as fact. The warning tokens already exist and
already mean "needs attention" elsewhere in the system (Input's
`status="error"`-adjacent semantics); reusing them is "reuse before
create" rather than adding a fourth semantic color.

SCOPE:
src/styles/components.css (new rule, additive), src/pages/Home.tsx
(local helper, not exported/shared).

IMPACT:
No existing component or token changed.

DATE:
2026-09-18
```

---

```
PROJECT DECISION (BV Seguros):
Removed the original vanilla-JS institutional site (HTML/CSS/JS,
server.js, no build step) that used to live at the repository root,
and promoted this Blueprint-based site (previously in a
site-blueprint/ subfolder) to the root in its place. The client chose
to keep only this version plus the CRM (crm/).

REASON:
Both versions existed side by side for comparison (see the two entries
above, dated 2026-09-18). The client reviewed both and asked explicitly
to keep only the Blueprint-based site and the CRM.

SCOPE:
Repository layout only. site-blueprint/* moved to the repository root;
the old root-level index.html/styles.css/script.js/server.js/
package.json/vercel.json/.htaccess/robots.txt/images/ were deleted.
crm/ is untouched. No component, token, or page content changed as
part of this move (see the two entries above for those).

IMPACT:
Relative paths that referenced "../crm/" or ".." (the old vanilla
site) from inside this project's own docs (MASTER-PROMPT.md) were
updated to the new same-level paths ("crm/"). This DECISIONS.md entry
itself is the only place the old three-project history is still
described; earlier entries above are left as written, as a
chronological record of what was true when they were made.

DATE:
2026-09-21
```

---

```
DECISION:
Global container/section system (<Container />, <Section />) as the
only source of page width and vertical rhythm.

REASON:
Prevents every section from inventing its own max-width/padding,
which is the #1 source of misaligned sections in ad-hoc-built sites.

SCOPE:
Global.

LEVEL:
Immutable (Level 1).

DATE:
2026-08-31
```

---

```
DECISION:
Hand-rolled minimal router (src/app/router.js, ~25 lines) instead of
react-router or another routing library.

REASON:
Two routes (Home, Laboratory) don't justify a routing dependency.
The Blueprint's stated priority order is native browser →  React →
internal reusable solution → external dependency, and the History
API + a small hook covers this case completely.

SCOPE:
Global (src/app/router.js, src/app/Link.jsx, App.jsx route table).

LEVEL:
Immutable (Level 1), but expected to be swapped for react-router (or
similar) once a project's route count/complexity genuinely justifies
it: that swap should be a new DECISIONS.md entry, not a silent
change.

DATE:
2026-08-31
```

---

```
DECISION:
ESLint (flat config, v9) instead of the oxlint that `npm create
vite@latest` now scaffolds by default.

REASON:
MASTER-PROMPT.md explicitly specifies ESLint as the intended tooling.
eslint-plugin-react / react-hooks / react-refresh give React-specific
rules (hooks rules, prop patterns) that the newer oxlint setup didn't
have configured out of the box.

SCOPE:
Global (eslint.config.js, package.json scripts/devDependencies).

LEVEL:
Immutable (Level 1).

DATE:
2026-08-31
```

---

```
DECISION:
`react/prop-types` disabled in eslint.config.js.

REASON:
The project deliberately excludes TypeScript (MASTER-PROMPT.md tech
stack rules) and does not install the separate `prop-types` package.
Adding it purely to satisfy this lint rule would itself violate the
"dependencies must earn their weight" rule. Runtime prop validation
without TS/prop-types isn't a real option here, so the rule can only
ever produce noise, not signal.

SCOPE:
Global lint config.

LEVEL:
Immutable (Level 1) unless the project later adopts TypeScript, at
which point prop validation comes from types instead and this stays
irrelevant.

DATE:
2026-08-31
```

---

```
OVERRIDE:
Root-level laboratory/ directory (present in MASTER-PROMPT.md §5's
example tree) was not created. The Laboratory is implemented purely
as src/pages/Laboratory.jsx behind the /laboratory route.

REASON:
MASTER-PROMPT.md §5 explicitly allows improving the example
architecture with clear technical justification. A directory outside
src/ has no role in a Vite build and would either sit unused or
require separate tooling to serve: pure duplication of a page that
already exists as a normal route, with no upside. §33 independently
describes the Laboratory as "uma rota/página," i.e. a page/route,
which is what's implemented.

SCOPE:
Directory structure only. No functional change: the Laboratory page
exists and behaves as specified.

IMPACT:
No other structural decision is affected. If a future need arises for
standalone (non-routed) QA fixtures, that's a separate, new decision.

DATE:
2026-08-31
```

---

```
DECISION:
v1.0.0 component set limited to Container, Section, Button, Input,
Card, Header, Footer: not the full list in MASTER-PROMPT.md §14.

REASON:
§14 and §36 both explicitly instruct against building "dezenas de
componentes" to pad the library, and prioritize defining the
architecture/contract correctly over exhaustive implementation.
Input and Card were added beyond the §36 minimum (Container, Section,
Button, Header, Footer) because the Laboratory page needs to
demonstrate form and card component states per §33, and both were
cheap to build correctly once Button's state pattern existed.

SCOPE:
src/components/**, docs/design-system.md.

LEVEL:
Level 3 (Component System): additive only. Adding Select, Modal,
Accordion, etc. later doesn't require revisiting this decision, only
recording their own.

DATE:
2026-08-31
```

---

```
DECISION:
Global structural centering: section openers (label + heading + lede),
feature grids, and button rows under a centered heading are centered
by default (.section-intro, .grid--center, .cluster--center, Card
`center`). Body prose, lists, and forms stay left-aligned regardless.

REASON:
Explicit project requirement. Reconciled against docs/anti-ai.md's
warning about an automatically centered Hero: that rule is about not
defaulting into a pattern without deciding it. This is the opposite
case, a deliberately chosen and documented default, applied only to
structural elements where centering doesn't hurt readability. Long-form
text stays left-aligned specifically because centering hurts readability
past a line or two.

SCOPE:
src/styles/tokens.css (--measure-intro, --measure-intro-wide),
src/styles/layout.css (.section-intro, .grid--center, .cluster--center),
src/styles/components.css (.card--center), src/components/ui/Card.jsx
(`center` prop), src/pages/Home.jsx (applied to the worked example).

LEVEL:
Immutable (Level 1) as a rule; the token values it depends on stay
Level 2.

DATE:
2026-08-31
```

---

```
DECISION:
Purged AI-tell writing patterns from all code, comments, docs, and
visible copy: em-dash used as a clause separator (140 occurrences,
replaced with periods/commas/colons depending on context), and the
"not X. It's Y" rhetorical construction in README.md.

REASON:
Explicit project requirement, aimed at output quality for client-facing
work. See docs/content-style.md for the full rule and the pattern list
to keep avoiding in new content.

SCOPE:
Every .md/.js/.jsx/.css/.html file in the repository except
node_modules and dist (build output, regenerated).

LEVEL:
Immutable (Level 1), documented in docs/content-style.md.

DATE:
2026-08-31
```

---

```
OVERRIDE:
Replaced create-vite's default favicon.svg (a purple/blue gradient
blob, the exact "generic AI-adjacent visual" docs/anti-ai.md warns
against) with a flat two-tone mark, and removed the unloaded "Inter"
font-family claim from tokens.css (declared but never actually loaded,
silently falling back to the system stack).

REASON:
Both were left over from create-vite's default scaffold and are
exactly the kind of unconsidered default this project's own rules
argue against. Fixing them is enforcing BLUEPRINT.md/anti-ai.md against
this repository itself, not a new rule.

SCOPE:
public/favicon.svg, src/styles/tokens.css (--font-display/--font-body).

IMPACT:
No component or token name changed. A project still swaps the favicon
and adds a real typeface (with its loading mechanism) as part of
Creative Direction, per MASTER-PROMPT.md.

DATE:
2026-08-31
```

---

```
DECISION:
Added `CookieConsent` (src/components/feedback/CookieConsent.jsx) as a new
Level 3 component: a consent banner plus a native `<dialog>` preferences
panel, with a two-tier model (`"necessary"` / `"all"`), not a granular
multi-category CMP.

REASON:
Cookie consent is close to mandatory for real client work and was a gap:
`docs/design-system.md`'s "Not yet implemented" list never mentioned it.
The two-tier model matches what most starter projects actually need; a
granular per-category CMP is real added complexity (more state, more
copy, more a11y surface) that should be built when a project's actual
integrations require distinguishing categories, not speculatively now.

`useCookieConsent` shares one module-level value across every call via
`useSyncExternalStore`, not a per-call `useState`.

SCOPE:
src/hooks/useCookieConsent.js (new), src/components/feedback/CookieConsent.jsx
(new), src/styles/components.css (new "COOKIE CONSENT" block), src/App.jsx
(renders it globally), docs/design-system.md, docs/accessibility.md,
docs/qa.md.

LEVEL:
Level 3 (Component System): additive only.

DATE:
2026-08-31
```

---

```
DECISION:
`useCookieConsent` reads/writes a single module-level value and notifies
subscribers via `useSyncExternalStore`, rather than each call owning its
own `useState`.

REASON:
Caught during manual QA, not anticipated up front: `CookieConsent` (the
banner) and the Laboratory's reset control both call `useCookieConsent()`.
With independent `useState`, clearing consent from the Laboratory updated
`localStorage` but left the banner's own state stale, so it didn't
reappear until a full reload. Any project embedding a "manage cookies"
control anywhere other than inside `CookieConsent` itself would hit the
same bug. `useSyncExternalStore` is the correct tool for "one source of
truth, multiple independent subscribers in the same render tree," which
is exactly this shape, rather than reaching for Context (adds a provider
for a single primitive value) or prop-drilling (there's no shared parent
between CookieConsent and an arbitrary future consumer).

SCOPE:
src/hooks/useCookieConsent.js.

LEVEL:
Level 3, internal implementation detail of an already-decided component:
doesn't change CookieConsent's or the hook's public contract.

DATE:
2026-08-31
```

---

```
DECISION:
CookieConsent's preferences dialog can be opened from anywhere (not just
its own banner button) via a `window` CustomEvent
(`blueprint:open-cookie-preferences`, exported as `OPEN_PREFERENCES_EVENT`
from `useCookieConsent.js`) instead of prop-drilling or a Context provider.
`navigation.js`'s `legalNav` entries gained an optional `action` field as
an alternative to `href` so a legal-nav item can trigger this instead of
navigating; `Footer.jsx` renders that one entry as a `<button>` dispatching
the event instead of an anchor.

REASON:
This is a rare, one-way signal (open the dialog) from a component
(Footer) that has no other relationship to CookieConsent's state. A
Context provider or prop-drilling through App.jsx would introduce a
dependency between two otherwise-independent components for a single
trigger. A native CustomEvent is zero-dependency, requires no provider
tree change, and keeps both components decoupled: Footer doesn't know
CookieConsent exists, it just dispatches a named event.

SCOPE:
src/hooks/useCookieConsent.js, src/data/navigation.js (`legalNav` shape),
src/components/layout/Footer.jsx.

LEVEL:
Level 3, additive convention (the `action` field is optional; existing
`href`-only entries are unaffected).

DATE:
2026-08-31
```

---

```
DECISION:
Added `BackToTop` (src/components/feedback/BackToTop.jsx) as a new Level 3
component, reusing the existing `useScrollState(threshold)` hook (the same
one `Header` uses for its own scroll-position detection) at a larger
threshold instead of a second, bespoke scroll listener. Coordinates with
`CookieConsent` and `Footer` through two shared, documented CSS hooks
(`body.has-cookie-banner`, `body.has-footer-visible`) rather than any
JS-level coupling between the components.

REASON:
`useScrollState` already does exactly the "past N px" tracking this needs;
writing a second scroll listener would duplicate existing, working code
(reuse before create). The bottom-fixed components (BackToTop,
CookieConsent's banner, Footer's own bottom-right content) need *some*
coordination to avoid overlapping, but making one aware of another's
internal state, or introducing shared state neither otherwise needs,
would violate the Rule of Permanence. A CSS class toggled by whichever
component owns the overlapping UI (the banner; the footer, via an
`IntersectionObserver` on itself) is the smallest coordination surface
that solves the actual problem. The footer case was caught during manual
QA, not anticipated up front: a fixed bottom-right control will always
end up covering part of the footer once the page is scrolled all the way
down, on any project that has both.

SCOPE:
src/components/feedback/BackToTop.jsx (new), src/components/feedback/CookieConsent.jsx
(toggles `has-cookie-banner`), src/components/layout/Footer.jsx (toggles
`has-footer-visible`), src/styles/components.css (new "BACK TO TOP"
block), src/App.jsx (renders it globally), docs/design-system.md, docs/qa.md.

LEVEL:
Level 3 (Component System): additive only.

DATE:
2026-08-31
```

---

```
DECISION:
Documented a "full-bleed split section" composition pattern in
docs/design-system.md (media running the full section height on one side,
copy in a nested Container on the other) instead of building a new
component for it.

REASON:
The pattern is genuinely just "put media outside the Container, put copy
inside one," a two-line deviation from the normal Section > Container
nesting. A component wrapping that would hide how simple the underlying
composition is and add an API (media position, aspect ratio, column
ratio, mobile stacking) for something that varies per project anyway.
Documenting the pattern with example markup keeps it visible and reusable
without adding to the component count for something that isn't a real
abstraction boundary.

SCOPE:
docs/design-system.md (new section), src/pages/Laboratory.jsx (demo,
nested inside the page's own Container for QA-page practicality rather
than breaking out of it).

LEVEL:
Level 4 (Creative Layer) guidance, not a Level 1/3 change: no component
API, no token, no required usage.

DATE:
2026-08-31
```

---

## v2.0.0: TypeScript and Tailwind migration (2026-08-31)

OVERRIDE:
The JavaScript-only baseline is replaced with strict TypeScript. Tailwind
CSS v4 is added through @tailwindcss/vite. Styles now use explicit cascade
layers: theme, base, components, utilities.

REASON:
Explicit user request to make TypeScript and Tailwind the default stack
for future websites. TypeScript protects shared component contracts;
typescript-eslint checks the migrated source; @types/node types the build
configuration. Tailwind provides token-backed composition utilities without
duplicating the design system or adding runtime UI dependencies.

SCOPE:
All application source extensions/types, Vite config, lint/build scripts,
dependency lockfile, CSS entry point, theme aliases and Laboratory blocks.
Component type-contract fixtures are checked with the application. Shared
responsive rules stay in responsive.css; local Tailwind variants are allowed.

IMPACT:
Existing component APIs, tokens, visual identity, routes, and interactions
are preserved. Cookie storage now rejects values outside the declared consent
union. Tailwind uses tw: to avoid existing class collisions and omits Preflight
to retain the Blueprint reset. Utilities intentionally outrank components;
existing styles retain their relative order. This source/cascade contract
change is a major release. No backend or deployment changes are included.

---

## v2.0.1: static QA audit script (2026-09-03)

DECISION:
Added `scripts/qa-audit.mjs` (`npm run qa`), a dependency-free Node script
that statically checks a subset of `docs/qa.md`: em-dash/banned-phrase
scans, hardcoded colors or `z-index` outside the token system, images
without `alt`, more than one `<h1>` per page, missing favicon/robots.txt/
sitemap/`og:image`, and dependencies declared but never imported.

REASON:
`docs/qa.md`, `docs/content-style.md`, and `docs/anti-ai.md` each define
rules that were previously only checkable by manually running the grep
command written into their prose, or by eyeballing the page. That doesn't
scale across projects built on this foundation and gets skipped under
deadline pressure. A script makes the checkable subset of those rules a
five-second command instead of a manual pass, while still deferring to
`docs/qa.md`'s manual checklist for what genuinely needs a browser
(responsive breakpoints, keyboard traversal, contrast, the cookie consent
flow end to end).

SCOPE:
`scripts/qa-audit.mjs` (new), `package.json` (`qa` script),
`eslint.config.js` (added a `scripts/**/*.mjs` block with Node globals,
since the existing config only declared browser globals), `README.md`
and `docs/qa.md` (pointers to the new script).

LEVEL:
Additive tooling, not a Level 1 rule change: it enforces existing rules,
it doesn't add new ones. Extend its checks the same way (map one to an
existing documented rule) rather than inventing new ad-hoc lint rules
inside it.

IMPACT:
No existing script's behavior changed. `Laboratory.tsx` is deliberately
exempt from the multiple-`<h1>` check (it demonstrates every heading
level side by side as the token/component QA page); `docs/content-style.md`
and `docs/qa.md` are exempt from the em-dash check (both quote the
character as a literal example of what to avoid, which is the rule's own
definition, not a violation of it).

DATE:
2026-09-03

---

## v2.1.0: Google Consent Mode v2 and legal page templates (2026-09-03)

DECISION:
Added Google Consent Mode v2 wiring (`index.html` default-consent script,
`src/utils/googleConsentMode.ts`) driven by the existing `CookieConsent`/
`useCookieConsent`, plus a `LegalLayout` component and three routed legal
page templates (`src/pages/legal/{Privacy,Terms,Cookies}.tsx`, at
`/privacy`, `/terms`, `/cookies`).

REASON:
Ported from a separate project (Premium Ride) that had this exact
Consent Mode v2 wiring and a GDPR-shaped Privacy/Cookies structure
reviewed and shipped in production. The Blueprint's own `CookieConsent`
already stored a consent decision but never surfaced it to Google's
Consent Mode, so a project loading GA4/Ads through this banner would
under- or over-share data relative to the visitor's actual choice.
Separately, `navigation.ts`'s `legalNav` already anticipated Privacy and
Terms entries (`href: "#"` placeholders) with no pages behind them: this
fills that gap with a real, reusable pattern instead of leaving every new
project to build legal pages from scratch.

SCOPE:
`index.html` (consent-default script), `src/utils/googleConsentMode.ts`
(new), `src/hooks/useCookieConsent.ts` (calls the new module on every
consent change and on mount), `src/components/feedback/CookieConsent.tsx`
(added a link to `/cookies` in the preferences dialog, closing the dialog
before navigating), `src/components/layout/LegalLayout.tsx` (new),
`src/pages/legal/*.tsx` (new), `src/styles/components.css` (`.legal-*`,
`.cookie-dialog__policy-link`), `src/App.tsx` (three new routes),
`src/data/navigation.ts` (`legalNav` hrefs point at the new pages).

LEVEL:
Level 3 (Component System) for `LegalLayout` and the Consent Mode bridge:
additive, no existing component API changed. The three legal pages are
Level 4 (Creative Layer) content skeletons, not Level 1 contracts: their
prose structure is a starting point, not a rule.

IMPACT:
"All" consent only ever grants `analytics_storage` /
`functionality_storage` / `personalization_storage`; `ad_storage`,
`ad_user_data`, and `ad_personalization` stay denied unconditionally,
because the banner never asks the visitor for ad consent. A project that
needs ads consent must add a third category to `CookieConsent` (see
`docs/design-system.md#cookieconsent`) and extend
`googleConsentMode.ts`'s mapping accordingly, rather than granting ad
consent nobody was asked about. The legal page templates contain bracketed
placeholders (`[COMPANY NAME]`, `[DATE]`, …) and must not ship as-is: see
`docs/anti-ai.md#content-integrity`.

DATE:
2026-09-03
```

---

```
DECISION:
Added docs/lessons-learned.md, consolidating generalizable technical
lessons (deployment/hosting gotchas, WCAG contrast-per-surface,
i18n key-per-meaning, vm-sandbox testing pitfalls, legal/compliance
ordering, image pipeline, SEO checklist gaps) pulled from real
projects built outside this repository.

REASON:
Explicit project requirement: capture hard-won operational knowledge
from real launches so it isn't re-learned from scratch on the next
project. Every entry was reviewed and generalized before inclusion;
client names, domains, contact details, account IDs, and credentials
were excluded on principle, not just redacted after the fact. Where a
lesson already exists as shipped code (Google Consent Mode v2, the
CookieConsent button hierarchy), the doc references that code instead
of restating it, to avoid two sources of truth drifting apart.

SCOPE:
docs/lessons-learned.md (new), a cross-reference added to
docs/agent-protocol.md's step 2 and README.md's "Start here" list, and
a "Security headers" subsection added to docs/performance.md
documenting the CSP `<meta>`-tag limitation this doc's deployment
section covers in more depth.

LEVEL:
Documentation only (Level 1 reading list, not a Level 1 rule itself).
No component, token, or existing doc's guidance was changed to
contradict what was already there.

DATE:
2026-09-18
```
