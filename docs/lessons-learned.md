# Lessons Learned

Generalizable technical lessons pulled from real projects built outside
this repository. Every entry here was a genuine mistake made, bug
hit, or non-obvious decision earned on a real deploy: not theory.

**What this file deliberately excludes**: client names, domains, real
contact details, account IDs, credentials, DNS records, or any other
identifying or sensitive detail from the source projects. Only the
generalizable *pattern* survives. If a future entry can't be stated
without naming the client it came from, it doesn't belong here.

## Deployment and hosting

**A static site with a local dev server can get misdetected as a Node
app on Vercel.** If `package.json` has a `start` script that runs a
Node server (even a dev-only one) and the repo also contains that
server file, Vercel's zero-config detection can conclude the whole
project is a Node app and route every request through it as a
serverless function. `index.html` still loads (the function serves
it), but `styles.css`, `script.js`, and images all 404 because they
never got bundled into the function. The page "works" but is
unstyled. Fix: a `.vercelignore` that excludes the dev server file,
and `vercel.json` pinning `"framework": null` and the real
`"outputDirectory"` so detection can't guess wrong.

**CSP `frame-ancestors` and `X-Frame-Options` in a `<meta>` tag do
nothing.** Both are silently ignored by browsers when set via
`<meta http-equiv="Content-Security-Policy">`; they only take effect
as real HTTP response headers. If security headers are set in the
HTML for local/static hosting *and* in host config (`vercel.json`,
`next.config.js` `headers()`, etc.) for real hosting, keep both in
sync manually. This repo's own security-header guidance
(`docs/performance.md`) should always point at host-level headers as
the actual enforcement point.

**On Apache/cPanel static hosting, `index.html` must be directly in
`public_html`.** One level of subfolder and Apache returns a plain
403, not a helpful error. If the same source tree is deployed to both
a Node-friendly host (Vercel) and classic Apache hosting, keep
dev-only files (`server.js`, `package.json`, `.md` docs) out of the
Apache upload, or block them via `.htaccess` in case they get
uploaded by accident.

**Local dev should mirror production headers, not just production
markup.** A dev server that sends the same CSP/security headers as
the real deploy means what's tested locally is actually representative
(see `docs/performance.md`'s security-header note).

## Framework and rendering choice

**A client-side-only SPA breaks Open Graph and social-card previews.**
Facebook/LinkedIn/WhatsApp/Twitter crawlers don't execute JavaScript
before reading `<meta property="og:*">` tags. If link-preview
appearance matters (it does for anything meant to be shared), the
marketing/content pages need to be statically generated or
server-rendered, not client-rendered only. This is a real reason to
reach for SSR/SSG (Next.js, Astro, or equivalent), not this
Blueprint's plain client-side Vite app, once that requirement exists.
Note it explicitly in a project's `MASTER-PROMPT.md` brief under
`TECH STACK` if it applies, since it changes the stack decision this
Blueprint otherwise defaults away from.

**The router graduation point is real, not hypothetical.** This
Blueprint's hand-rolled router (`src/app/router.js`, see
`DECISIONS.md`) is deliberately minimal for a handful of routes. A
project that grows past roughly five real routes, or needs nested
layouts/loaders, hit the point where switching to `react-router` (or
similar) is the right call. When that happens, record it as a new
`DECISIONS.md` entry the same way the original choice was recorded:
this isn't a silent swap.

## Accessibility

**The same muted-text color can pass contrast on one background and
fail on another.** A single `--color-text-muted` token used against
both a light surface and a dark surface can be WCAG AA on one and fail
on the other. The fix isn't a single "muted" value: it's two tokens
(e.g. `--color-text-muted` for light surfaces, a separate
darker-surface variant) picked so each one clears AA in its own
context, applied by which surface the text sits on, not globally. Any
project adding a dark-surface section (see `.footer` in this
Blueprint, which already does this by using `--color-neutral-400` /
`-300` against `--color-neutral-950` rather than the light-surface
muted tokens) should verify contrast per surface, not assume one
muted token works everywhere. Cross-reference:
`docs/accessibility.md#contrast`.

**A custom cursor needs to confirm it's actually active before hiding
the native one.** Setting `cursor: none` unconditionally in CSS means
a JS failure (blocked script, error, slow load) leaves the visitor
with no cursor at all. Only apply `cursor: none` after the
replacement cursor's JS has actually initialized (a class toggled by
script, not a static CSS rule).

## Internationalization

**An exact-match translation dictionary needs one key per meaning, not
per literal string.** A PT→EN dictionary keyed by the literal source
text breaks when the same PT phrase is reused for two UI elements that
need *different* English translations in context (e.g. a generic
"Voltar ao início" used both as a page-level "back to home" link and
as a component-level "back to top" button). Fix: give each distinct
*meaning* its own key, even if the source-language text happens to
coincide, rather than deduplicating by literal string.

## Testing

**Objects created inside a Node `vm` sandbox fail `assert.deepEqual`
against normal-realm literals, even with identical values**, because
they have different prototypes across realms. When testing code that
runs inside a `vm.Context` (common for testing static-site build
scripts without a browser), compare individual properties instead of
using deep-equality across the sandbox boundary.

**Minimal hand-written mocks beat a heavy testing-DOM dependency for
sandboxed script tests.** `IntersectionObserver` and `matchMedia` can
both be mocked with small classes: an observer mock that records
instances and exposes a way to manually fire `isIntersecting`, and a
`matchMedia` mock that returns a controllable `matches` value so
`prefers-reduced-motion` behavior is actually testable, not assumed.

**When a visual browser pane is unreliable (hidden, flaky
screenshots), validate through the DOM instead of fighting the
screenshot tool.** `getComputedStyle`, `getBoundingClientRect`, and
reading the live DOM tree are deterministic and don't depend on the
pane actually rendering a frame. Reserve screenshots for a final
visual sanity check once DOM-level checks already pass, not as the
only verification method.

## Conversion and legal/compliance ordering

**Ship the privacy policy update before the feature that needs it, not
after.** A contact form that starts collecting real personal data has
to have an accurate, already-updated privacy policy live *before* it
goes live, not as a follow-up task. Sequence privacy/legal-content
updates ahead of the feature that changes what data gets collected.

**A "this is informational, not an offer" disclaimer is the correct
pattern when displaying third-party categories/eligibility a business
hasn't itself confirmed** (e.g. listing a platform's official service
tiers without confirming which of them the business actually
supports). Pair the disclaimer with a citation to the official source,
and keep the claim scoped to "here's what the third party defines,"
not "here's what we offer."

**A mailto-only contact form is a legitimate zero-backend fallback for
static hosting**, with a known tradeoff (depends on the visitor having
a configured mail client) and a clear upgrade path (Formspree or a
small serverless function). If the submission target changes, remember
the CSP `form-action` directive has to be updated everywhere it's
declared (meta tag and host headers both), not just the form's
`action` attribute.

**Cookie consent banners need Google Consent Mode v2 to load before
any analytics/ads script**, defaulting every consent category to
denied except `security_storage`, so nothing fires before the visitor
actually chooses. This Blueprint already ships this: see
`src/components/feedback/CookieConsent.tsx` and
`src/utils/googleConsentMode.ts`, ported from a project that shipped
this exact wiring in production (`DECISIONS.md`, 2026-09-03 entry) and
carrying the same "Accept all" / "Necessary only" / "Manage
preferences" button hierarchy validated across real launches. If the
analytics requirement allows it, a cookieless analytics tool (no
personal data collected) avoids needing a consent banner for analytics
at all, which is a real option to raise with a client before
defaulting to GA4-plus-banner.

**A floating WhatsApp CTA is a proven, cheap conversion pattern for
service businesses in this market.** Combine it with click-to-call/
click-to-WhatsApp analytics events once analytics is wired up, so the
conversion channel that's actually working is visible, not assumed.

## Layout and media

**A full-viewport-minus-header section should use
`min-height: calc(100svh - var(--header-height))`, not a fixed
`height`.** This fills the viewport when content is short, but lets
the section grow naturally past viewport height when its content needs
more room, with no internal scroll or clipping either way.

**Keep original high-resolution images in a separate source folder and
export sized/format variants from them**, rather than hand-editing the
in-use assets directly. When a placeholder photo gets replaced with a
real one, naming the real file identically to the placeholder it
replaces (same filename, same folder) means the swap needs zero CSS/
markup changes.

**A scroll-to-top button should appear only past a real scroll
threshold** (not immediately), and its click handler should respect
`prefers-reduced-motion`: `scrollTo({ top: 0, behavior: 'instant' })`
when reduced motion is requested, `'smooth'` otherwise.

## SEO baseline (extending `docs/agent-protocol.md`'s SEO section)

Confirmed as the real, complete checklist across multiple launches, not
just the subset this Blueprint ships by default: canonical URL, Open
Graph with an *absolute* image URL (a relative one breaks on most
crawlers), Twitter Card, JSON-LD structured data matching the actual
business type (`Organization`, `LocalBusiness`, etc. as appropriate),
`sitemap.xml` reflecting every real route, `robots.txt`, a favicon set
that includes `apple-touch-icon` and a web manifest (this Blueprint's
current baseline covers favicon + robots + sitemap + OG tags only; the
manifest and `apple-touch-icon` are a gap to close on any project that
needs full SEO/PWA-adjacent polish).
