# BLUEPRINT

This is the structural contract for every project built on Web
Blueprint. Read this before `docs/*`. If a doc and this file disagree,
this file wins: file an update rather than working around it.

## The core principle

**Consistency without uniformity.** The Blueprint standardizes *how*
projects are built: containers, spacing, responsive behavior, component
states, accessibility, architecture. It never standardizes *how a
project looks*: colors, type, composition, tone, motion style, whether
the Hero is centered or asymmetric or full-viewport WebGL. That's
Creative Direction: see `MASTER-PROMPT.md` §"Blueprint vs Creative
Direction".

A corporate SaaS site, a luxury editorial site, and an experimental
WebGL portfolio should all be able to sit on this foundation and look
nothing alike.

## The four levels

**Level 1: Immutable Foundation.** Structural rules not meant to
change per project without an explicit, documented reason: the
Container/Section philosophy, the React architecture, the CSS import
order and cascade, the accessibility baseline, the responsive strategy,
the agent protocol. Changing these is a `DECISIONS.md` entry, not a
drive-by edit.

**Level 2: Project Tokens.** `src/styles/tokens.css`. Colors,
typography, spacing scale, radius, shadows, container widths, motion:
every value here is expected to be replaced per project. The *names*
are Level 1; the *values* are Level 2.

**Level 3: Component System.** `src/components/`. Reusable,
token-driven, composable. See `docs/design-system.md` for the current
contract of each.

**Level 4: Creative Layer.** Hero composition, imagery, illustration,
storytelling, WebGL/3D, bespoke motion: total freedom, built on top of
Level 1–3 rather than around them.

## React component philosophy

The default stack is React + TypeScript (strict) + Vite + Tailwind CSS v4.
Application source uses `.ts` / `.tsx`. Tailwind uses the `tw:` prefix and
the token aliases in `src/styles/tailwind.css`; see `docs/stack.md`.
The CSS cascade is explicitly layered: theme, base, components, utilities.
Within the Blueprint CSS, existing import order remains unchanged.
The Blueprint reset is retained instead of Tailwind Preflight.

Componentize when there's real reuse, a clear responsibility, or actual
behavior to own. Don't turn every `<div>`, heading, or small static
block into its own component file: that's indirection without
benefit. Prefer composition (small primitives assembled in a page) over
one large component with a dozen conditional props.

## Layout rules

- `<Container />` is the only place page width is decided.
- `<Section />` is the only place vertical rhythm is decided. A
  full-bleed background goes on the `Section`; content still aligns
  through a `Container` nested inside it.
- CSS Grid for structural layout, Flexbox for component-internal
  alignment. Don't force every layout through a rigid 12-column grid if
  the content wants asymmetry: `layout.css`'s `.grid` primitive is a
  convenience for the common case, not a constraint on the uncommon
  one.

## Reuse before create

Before adding a component, hook, CSS class, token, or dependency:
check whether something equivalent already exists. Priority order:
**reuse → extend → create**. This is the single biggest lever against
the "dozens of near-duplicate components" failure mode.

## The Rule of Permanence

A change scoped to one part of the site must never ripple into global
decisions or unrelated components without a documented, technical
reason. "Update the pricing cards" is not license to also touch the
Header, Footer, global tokens, or other sections: see
`docs/agent-protocol.md` for the full change-scope procedure.

## Language permanence

Every project declares one language variant explicitly (e.g.
`pt-PT`, `pt-BR`, `en`). Once set, all content stays in that variant.
Never auto-mix variants within a project; changing the declared
language is itself an explicit, deliberate action, not a side effect of
adding content.

## Content integrity

Never fabricate clients, testimonials, awards, partners, statistics, or
company history on a project's behalf. Use a visibly-marked placeholder
when real content isn't available yet. See `docs/anti-ai.md`.

## Override system

Every rule here can be broken when there's a real reason: this is a
foundation, not a cage. Document the break in `DECISIONS.md` using:

```
OVERRIDE:
<what rule, and where>

REASON:
<why>

SCOPE:
<exactly what this affects: nothing else>

IMPACT:
<what does NOT change because of this>
```

## Versioning

`MAJOR.MINOR.PATCH`. MAJOR = incompatible structural change. MINOR =
new capability, backward compatible. PATCH = fixes/refinements. Current:
see `CHANGELOG.md`.
