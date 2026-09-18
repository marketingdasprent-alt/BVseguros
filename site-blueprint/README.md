# Web Blueprint

A reusable React + TypeScript + Tailwind CSS v4 foundation for building websites:
design tokens, layout primitives, a small component system, and the
governance rules that keep an AI-assisted codebase consistent without
making every project look the same.

Don't clone this visually as a finished design. Treat it as the
plumbing underneath a design: containers that stay aligned, spacing
that stays on-scale, components with real interactive states, and
documentation that lets another agent (human or AI) pick up the
project without re-deriving context. See `BLUEPRINT.md` for the full
philosophy.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. `/laboratory` is the token/component QA
page: start there to see everything the system ships.

```bash
npm run lint     # ESLint
npm run typecheck # Strict TypeScript checks
npm run check    # Lint + typecheck + production build
npm run build    # production build
npm run preview  # preview the production build locally
npm run qa       # static audit: content, tokens, a11y, SEO, dependencies
```

## Where things live

```
src/
├── app/          # tiny History-API router + <Link />
├── components/
│   ├── ui/           # Button, Card
│   ├── layout/        # Container, Section, Footer, LegalLayout
│   ├── navigation/    # Header
│   ├── forms/         # Input
│   └── feedback/       # CookieConsent, BackToTop
├── data/         # navigation.ts: nav links consumed by Header/Footer
├── hooks/        # useScrollState, useCookieConsent
├── utils/        # googleConsentMode: Consent Mode v2 bridge
├── pages/
│   ├── legal/         # Privacy, Terms, Cookies (GDPR-shaped templates)
│   └── Home, Laboratory
└── styles/       # tokens → reset → global → typography → layout →
                  # components → utilities → responsive (import order
                  # in src/index.css matters: see BLUEPRINT.md)
```

## Start here

1. `BLUEPRINT.md`: the structural contract (read this first).
2. `docs/design-system.md`: token reference + component contracts.
3. `docs/anti-ai.md`: what to avoid defaulting into, and why.
4. `docs/content-style.md`: how to write copy and docs without the
   patterns that read as AI-generated.
5. `MASTER-PROMPT.md`: the brief to fill out when starting a new
   project on this foundation.
6. `docs/agent-protocol.md`: the before/during/after checklist for
   making a change.
7. `docs/lessons-learned.md`: real deployment, accessibility, testing,
   and compliance-ordering gotchas pulled from actual projects built
   on this foundation, generalized and anonymized.

## Starting a new project from this foundation

Copy this repository, fill out the brief in `MASTER-PROMPT.md`, and
replace the **values** in `src/styles/tokens.css` (palette, type,
spacing scale if needed): never the token **names**, which is what
keeps components working unmodified across projects. Then build the
Creative Layer (Hero, imagery, composition, tone) specific to that
project on top of the Container/Section/token system underneath.

## Versioning

`MAJOR.MINOR.PATCH`: see `CHANGELOG.md`. Current: `2.1.0`.

## TypeScript and Tailwind

Application code uses `.ts` / `.tsx`, strict type checking, and typed
component props (including the `as` prop). The build fails on type errors.

Tailwind v4 is integrated through its Vite plugin. Use prefixed utilities
such as `tw:flex tw:gap-sm tw:bg-panel tw:text-copy`. Theme aliases in
`src/styles/tailwind.css` refer to the existing `tokens.css` variables;
change the project identity in `tokens.css`, not in two parallel themes.

The Blueprint reset replaces Tailwind Preflight. Existing component CSS
is retained in the components layer; Tailwind utilities can override it.
Do not replace Container/Section with Tailwind's container utility.
See `docs/stack.md` for examples, responsive rules, and migration notes.
