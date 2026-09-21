# TypeScript and Tailwind

## Default stack

React + TypeScript (strict) + Vite + Tailwind CSS v4. TypeScript checks
contracts during development; it does not replace runtime validation or
tests. Use `.tsx` for components and `.ts` for hooks/data/helpers. Do not
silence migration errors with `any`, `@ts-ignore`, or disabled strictness.

`npm run typecheck` checks types; `npm run check` runs lint and the checked
production build. ESLint's own configuration remains an ESM JavaScript file.

## Styling

Use Tailwind for new local compositions and simple utility styling. Keep
reusable components, complex state rules, and accessibility CSS centralized.
Existing CSS is supported, not deprecated. Do not mechanically rewrite all
component styles or copy their class lists into every page.

```tsx
<Section>
  <Container>
    <div className="tw:flex tw:flex-col tw:gap-md tw:rounded-card tw:bg-panel-alt tw:p-lg">
      <h2 className="tw:text-h2 tw:text-copy">Project heading</h2>
      <p className="tw:text-copy-secondary">Real project content.</p>
      <Button variant="primary">Continue</Button>
    </div>
  </Container>
</Section>
```

- Prefix: `tw:flex`, `tw:hover:bg-brand-hover`, `tw:md:grid-cols-2`.
- Spacing: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`.
- Colors: `page`, `panel`, `panel-alt`, `brand`, `copy`, `copy-secondary`,
  `copy-muted`, `line`, and semantic feedback aliases. See `tailwind.css`.
- Radius: `control`, `card`, `panel`, `feature`, `pill`.
- Type: `display`, `h1` through `h4`, `body`, `body-large`, `body-small`,
  `caption`, `label`. Font families: `heading`, `copy`, `code`.
- Shadows: `low`, `raised`, `floating`, `overlay`.

The default Tailwind color/spacing/type/radius/shadow scales are replaced
with Blueprint aliases. All visual identity values remain in `tokens.css`.
Use static complete class names: select from a typed map instead of building
strings such as `tw:bg-${color}`, which the source scanner cannot discover.

## Cascade and responsiveness

Layers: `theme` -> `base` -> `components` -> `utilities`. Tailwind utilities
can intentionally override existing component classes without `!important`.
The original stylesheet order is preserved inside these layers. The `tw:`
prefix prevents accidental collisions with `.container`, `.grid`, etc.
Preflight is omitted because the Blueprint already has a reset. When using
border-width utilities on new plain elements, also specify `tw:border-solid`
or the intended style; do not depend on Preflight to supply it.

Keep shared responsive behavior in `responsive.css`. Local compositions may
use Tailwind responsive variants: sm=640px, md=768px, lg=1024px, xl=1280px,
2xl=1536px at the standard 16px initial font size. Continue using fluid
tokens first and validating the existing QA widths. Container/Section still
own page width and vertical rhythm; do not substitute `tw:container`.

## Migrating a project from v1

Use extensionless imports or update `.jsx` to `.tsx` and application `.js`
to `.ts`. Update the HTML entry point to `src/main.tsx`. Install using the
lockfile (`npm ci`), then run `npm run check`. Components retain their
runtime APIs, but invalid variants, props, or event types now fail checking.
The major version reflects the source-path and stylesheet-cascade changes.
