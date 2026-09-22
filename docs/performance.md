# Performance Rules

## Core Web Vitals targets

| Metric | Target | Primary lever here |
|---|---|---|
| LCP | < 2.5s | Image sizing/format, avoid render-blocking CSS/JS, no CLS-inducing late layout |
| CLS | < 0.1 | `aspect-ratio` / explicit dimensions on all media, no late-injected banners |
| INP | < 200ms | Small JS surface area, no unnecessary re-renders, native elements over heavy JS widgets |

## Rules

- **React is not a license for unnecessary JavaScript.** If a piece of
  UI is static, it doesn't need to be a component with state: plain
  JSX markup is fine. See "Component Philosophy" in `BLUEPRINT.md`.
- **Dependencies must earn their weight.** Before adding one, check
  whether the browser, React, or a small amount of project code already
  solves it. The routing in `src/app/router.ts` (a ~20-line
  History API wrapper) exists specifically because `react-router` isn't
  justified for two routes: that math changes as a project grows, but
  the default is to ask.
- **Images**: always give `width`/`height` or `aspect-ratio` to prevent
  CLS; prefer modern formats (WebP/AVIF) with a fallback; lazy-load
  anything below the fold (`loading="lazy"`); use `srcset` for
  responsive delivery instead of shipping one oversized asset to every
  viewport.
- **Fonts**: self-host or use `font-display: swap`; don't block first
  paint on a webfont. `tokens.css` defaults to the system font stack
  precisely so a project doesn't pay a font-loading cost until it
  deliberately opts into a custom typeface.
- **Third-party scripts**: every one is a tax on LCP/INP and a
  potential CLS source. Load async/deferred, and only add one with a
  clear reason.
- **Code splitting**: reach for `React.lazy()` / dynamic `import()`
  when a route or component is genuinely large and not needed on
  first paint (e.g., a rich modal, a chart library): not as a default
  applied to every component.
- **CSS**: the token/reset/layout/components/utilities/responsive split
  in `src/styles/` is loaded as one bundled stylesheet by Vite; don't
  fragment it further per-component without a measured reason: extra
  `<style>` tags and CSS-in-JS runtime cost more than they save at this
  scale.

## Security headers

Not strictly a performance concern, but the same "host-level config,
not markup" principle applies and this is the natural place a project
looks for it. Set CSP, `X-Frame-Options`, `Referrer-Policy`, and
`Permissions-Policy` at the host (Vercel `headers()`/`vercel.json`,
Netlify `_headers`, or equivalent), never only as an HTML `<meta>` tag:
`frame-ancestors` (CSP) and `X-Frame-Options` are both silently ignored
by browsers when set via `<meta http-equiv>`, they only take effect as
real HTTP response headers (see `docs/lessons-learned.md`). If a form
or script's target changes (a new form-submission endpoint, a new
analytics domain), update the CSP `connect-src`/`form-action` at the
host config, not just wherever the markup changed.

## Build-time checks

`npm run build` should be run before considering a change complete for
anything touching bundle size (a new dependency, a new route, a large
asset). Watch for a dependency pulling in an unexpectedly large
sub-tree: `npm ls <package>` if a build size jump is suspicious.
