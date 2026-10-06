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

### `<CardGrid />` / `.card-grid` (sets of boxes)

`src/components/layout/CardGrid.tsx` + `src/styles/layout.css`. **Rule:
every repeated set of boxes (cards, tiles, channels, coverages) uses
`<CardGrid>`.** It counts its children and balances the rows
(`src/utils/colunasEquilibradas.ts`): an even count fills equal rows
(4 as 2+2, 6 as 3+3, 8 as 4+4); an odd count keeps a centred last row,
the "V" (5 as 3+2, 7 as 4+3), never a lone box when it can be avoided
and never a row hanging left. When it uses fewer columns than asked,
the grid narrows and centres so each box keeps its usual width.
`<CardGrid as="ul" cols={4} colsTablet={2}>`. Columns: `--cols` (desktop, default 3), `--cols-tablet` (< 1024px,
default 2), `--cols-mobile` (< 640px, default 1); gap: `--gap`. Boxes in
the same row stretch to the same height. Forms and prose never use it.


Below 1024px, buttons in a `.cluster` share the row or each fill it
when they wrap, for the same reason.

`npm run qa:layout` (dev server running) checks the rule in a real
browser on every page at 375/768/1024/1280/1440px: no horizontal scroll,
last row centred, even counts in equal rows, equal heights per row. `--shots=<dir>` also saves a
full-page screenshot of each page and width.

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

### InputValidado: `src/components/forms/InputValidado.tsx`

`Input` plus a validator from `src/utils/validacoes.ts` (NIF with the
mod-11 check digit, Portuguese phone, email, name, postal code, number
plate, dates). The validator's message goes into `setCustomValidity`, so
the browser blocks the submit; the same message shows as the `error`
state only after blur or a submit attempt, never while typing. An
optional `formatar` tidies the value on blur (`aa00aa` becomes
`AA-00-AA`, `1000001` becomes `1000-001`). Form fields in
`src/data/formularios*.ts` opt in with `validar` / `formatar`. Rules
that need two fields (driving licence year vs. date of birth) run in the
form's step validation (`regras` in `FORMULARIOS`). `filtrar` cleans
the value keystroke by keystroke (digits only in NIF fields). Empty,
out-of-range and externally set errors also show as a sentence under the
field (`mensagemNativa`), never as the browser bubble. Tests: `npm test`.

Special fields, same contract (error under the field, after blur or a
"Próximo"):

- **CampoMatricula**: three 2-character boxes on a plate with a "P" strip
  (`.plate`), 6 characters at most. Typing jumps to the next box,
  Backspace on an empty box goes back, and pasting or autofill in any box
  splits the whole plate across the three from the first
  (`repartirMatricula`). The value travels in a hidden `d_matricula`
  (`AA-00-AA`). Optional "Ainda não tenho matrícula" toggle.
- **CampoCodigoPostal**: `0000-000` mask while typing, then a lookup on
  moradas.dev: shows the locality, or "Este código postal não existe".
  No answer (rate limit, network): format check only, never blocks.
- **CampoMorada**: combobox (arrows, Enter, Escape) with moradas.dev
  suggestions; picking a street fills the linked postal code, or asks for
  the door number when the street has several.
- **CampoPessoas**: one card per insured person, age only, "+ Acrescentar
  pessoa" / "Remover", focus moved to the new box or back to the add
  button.
- **Option cards** (`.option-card` inside `CardGrid`): a large radio for
  the first choice of a step, with a one-line description.

### CaixaVerificacao: `src/components/forms/VerificacaoHumana.tsx`

Cloudflare Turnstile in `interaction-only` mode, placed after the
consent checkbox in every site form. Invisible unless Cloudflare needs
the visitor to click; a negative top margin cancels the `.stack` gap so
the invisible widget leaves no empty row. The form keeps the token
through `useVerificacaoHumana()`, waits for it on submit (button in its
loading state) and asks for a new one after every attempt, because
tokens are single use. The token is checked on the server by
`api/pedido.ts`, which also applies the per-IP limit before calling
Supabase. Without `VITE_TURNSTILE_SITE_KEY`, development uses
Cloudflare's always-pass test key.

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
Background is `--color-surface-inverse` (navy family), text and borders use
the `--color-text-on-dark-*` / `--color-border-on-dark*` tokens. `minimo`
(`<Footer minimo />`, used on the request pages) renders only the bottom bar.

### CookieConsent: `src/components/feedback/CookieConsent.tsx`

A consent banner plus a native `<dialog>` preferences panel, rendered once
globally (`App.tsx`). Two-tier model only, `"necessary"` or `"all"`: not a
granular multi-category CMP (see `DECISIONS.md` for why that scope was
deliberately left out; add categories only when a real integration needs
them).

**Button hierarchy is deliberate**: Accept all and Necessary only share a
row with the **same weight** (both `primary`, BV Seguros override of
2026-10-01, see `DECISIONS.md`: refusing must be as easy as accepting);
Manage preferences (`ghost`) sits below on its own. From 768px the banner
lays out as text on the left and buttons on the right, to take less height.
While it is open, `body` reserves its height at the bottom
(`--cookie-banner-altura`, measured with a `ResizeObserver`), so the end of
any page can always be scrolled clear of it. On the request pages
(`/pedir-proposta`, `/participar-sinistro`) it renders with `emLinha`
instead: at the top of the page, in flow (`.cookie-banner--em-linha`), so
it never covers a form field or "Próximo" (BV Seguros, 2026-10-02).

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

## BV Seguros: navigation and page components

Project-specific (Level 2), see `DECISIONS.md` 2026-09-29.

- **MegaMenu** (`src/components/navigation/MegaMenu.tsx`): the nav link
  navigates and carries `aria-expanded` / `aria-controls`. Mouse hover
  opens the panel, and so does keyboard focus on the link (Tab then goes
  into the panel). No chevron button (client asked for no arrows on the
  site, 01/10/2026): on touch the link goes to the Seguros page, which
  lists everything. Escape closes and returns focus to the link; click
  outside, focus leaving the menu and route changes close it. Hidden
  below 1024px, where the mobile panel shows the same groups in a
  native `<details>`. Fed by `primaryNav[].submenu`.
- **SegmentTabs** (`src/components/navigation/SegmentTabs.tsx`): ARIA
  tabs with roving tabindex, arrows/Home/End, automatic activation.
  The caller owns the panel (`id="<id>-painel"`, `role="tabpanel"`).
- **Breadcrumb** (`src/components/navigation/Breadcrumb.tsx`): `<nav
  aria-label="Caminho">` + `<ol>`; last item is `aria-current="page"`.
- **Accordion** (`src/components/ui/Accordion.tsx`): FAQ on native
  `<details>/<summary>`; answers flagged `porConfirmar` render inside
  `PorConfirmar`.
- **ComparacaoNiveis** (`src/components/ui/ComparacaoNiveis.tsx`): level
  cards + a real `<table>` (`th scope`, hidden caption) in a focusable
  region. Below 640px the cards become a scroll-snap row and the table
  shows one level at a time, picked with `SegmentTabs` (hidden columns
  are `display: none`, so screen readers get the same single level).
  Always shows the "níveis ilustrativos" note.
- **PageSubnav** (`src/components/navigation/PageSubnav.tsx`): sticky
  anchor bar under the header. The active section is the last one whose
  top passed 35% of the viewport (scroll + rAF, `useSecaoAtiva`); marked
  with `aria-current="true"` and scrolled into view when the bar
  overflows horizontally.
- **ContactoForm por passos** (rendered on the request page, PaginaPedido;
  `src/sections/ContactoForm.tsx` + `src/components/forms/CamposRamo.tsx`),
  modelled on the Fidelidade simulators: one topic per screen, a step bar
  (`PassosProgresso`: only the current step shows its name, the others a
  number or a tick joined by equal lines, always one row; done steps are
  clickable; "Passo 2 de 5, Nome" below 640px), "Anterior" / "Próximo",
  and a last "Rever e enviar" step with a
  summary per block and "Alterar" (`ResumoPedido`). Steps: the insurance
  type in option cards (generic form only, `EscolhaRamo`: a mouse or touch
  choice moves on, arrow keys only select and Enter moves on), the ramo's
  `passos` from `FORMULARIOS`, the personal data (NIF and postal code
  required), then the review with consent and Turnstile. All steps stay
  mounted in one `<form noValidate>`, hidden with `hidden`; "Próximo"
  validates only the current step and focuses the first error; Enter in a
  field or an option moves on instead of submitting. Side by side, text,
  date and select boxes share one height (`.form-grid` rule) and radio
  pills start at the same line as the boxes. Fields can appear only in
  some cases (`mostrarSe`, `obrigatorioSe`), read from the DOM on every
  change (`lerValores`); a hidden field is not rendered, so it is neither
  sent nor validated. Field names carry the `d_` prefix. On submit the
  answers go into the lead message by block (`[O veículo]`, then
  "Rótulo: valor") via `montarMensagem`. Nothing is sent before the last
  step.
- **ContactoPainel** (`src/sections/ContactoPainel.tsx`): Home contact
  block, `id="contacto"`. Photo clipped by a diagonal with a navy/accent
  stripe (`clip-path`, turns horizontal below 768px), contacts from
  `CANAIS`, CTAs to `/seguros` and `/sinistros`.
- **MapaGoogle** (`src/components/ui/MapaGoogle.tsx`): three states:
  no confirmed address (placeholder card, no request), address without
  Marketing consent (card + "Mostrar mapa"), loaded iframe.
- **PaginaPedido** (`src/pages/PaginaPedido.tsx`): the only place the
  site forms render, as a whole page like the Fidelidade simulator (no
  pop-up, client's choice 01/10/2026): `/pedir-proposta` and
  `/participar-sinistro`, with the ramo in the path
  (`/pedir-proposta/automovel`); the level chosen on a ramo page travels
  as `?nivel=`. URLs come from `hrefProposta` / `hrefSinistro`
  (`src/app/proposta.ts`); `abrirProposta` / `abrirSinistro` navigate to
  them from buttons. The page swaps the site header for a minimal bar
  (logo and "Sair", back to where the request usually starts), keeps the
  footer, and lays the form across the standard container in 2 columns.
  Without a fixed ramo, both forms start with the insurance type as their
  first step. The claim form is the same step form (`ContactoForm` with
  the claim `Modalidade`: `FORMULARIOS_SINISTRO`, 112 notice on top,
  optional NIF, no postal code, sent to pedidos_sinistro): plate (car),
  ocorrência, apólice, descrição, dados, rever. Nothing opens below in
  any form: changing step slides the page sideways (from the right
  going forward, from the left going back; no motion under
  prefers-reduced-motion). A question that decides what comes next sits
  in its own step and moves on by itself once answered (`avancaQuando`):
  the plate (big and centred, `destaque`) when complete or with "Ainda
  não tenho matrícula", and the choice cards when picked with mouse or
  touch (arrow keys only select; Enter or "Próximo" moves on). What
  depends on it goes in the next step, or in a step that only exists in
  that case (`mostrarSe` on the step, e.g. "Quem fica com o seguro").
- **LineIcon** (`src/components/ui/LineIcon.tsx`): stroke icons shared by
  sections. `IconeTraco` (same file) is the one base: `LineIcon` and
  `RamoIcon` are both maps of paths drawn through it (24x24, stroke 1.75).
  Chip and glyph sizes come from `--icon-size-sm/md/lg/xl/2xl`.
- **HeroFotos** (`src/components/layout/HeroFotos.tsx`): the dark hero with
  rotating photos, shared by Home, Seguros, each ramo page and Sinistros.
  Props: `slides`, `pontos`, `topo` (breadcrumb), `rotulo`, `titulo`,
  `lede`, `acoes`, `nota`, `children` (full-width content inside the hero,
  e.g. the Home ramo picker). Change the hero here, never per page.
- **Card surface**: `.card`, `.spotlight-card`, `.claim-card`,
  `.channel-card`, `.coverage-item` and `.level-card` share one rule for
  background, border and radius; each variant only sets its inside.
- **Utilities** (`utilities.css`): `.mt-2xs/sm/md/lg/xl` and
  `.col-span-6/7`, instead of repeated `style={{ marginTop }}` /
  `gridColumn`.
- **Vocabulary**: the one name per action is in
  `docs/refinamento-ux-ui.md` (glossary, section E): "Pedir proposta",
  "Participar sinistro", "Ver seguro", "Ver todos os seguros", "Fale
  connosco", "Pedido recebido.", "você" throughout.

## Not yet implemented

Select, Checkbox, Radio, Modal, Carousel, Alert, Tooltip, Badge
(Accordion, Tabs and Breadcrumb now exist for BV Seguros, above). Per `MASTER-PROMPT.md` §14/§36, v1.0.0 proves the
architecture rather than pre-building every component. Add one when a
real page needs it: reuse the token set and the state-contract pattern
above (default/hover/focus/active/disabled at minimum for anything
interactive) rather than inventing a new pattern per component.

`CookieConsent` uses a native `<dialog>` and a plain `<input type="checkbox">`
internally rather than waiting on formal `Modal`/`Checkbox` components: both
stay local, undocumented markup inside that one component. Don't treat this
as those components existing; build `Modal`/`Checkbox` properly, with their
own contract here, the day another feature actually needs a reusable one.
