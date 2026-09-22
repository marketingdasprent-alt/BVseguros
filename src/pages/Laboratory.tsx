import type { ReactNode } from "react";
import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/forms/Input";
import useCookieConsent, {
  OPEN_PREFERENCES_EVENT,
} from "../hooks/useCookieConsent";

const COLOR_SWATCHES = [
  ["background", "--color-background"],
  ["surface-alt", "--color-surface-alt"],
  ["border", "--color-border"],
  ["primary", "--color-primary"],
  ["secondary", "--color-secondary"],
  ["accent", "--color-accent"],
  ["success", "--color-success"],
  ["warning", "--color-warning"],
  ["error", "--color-error"],
];

const SPACING_TOKENS = [
  "3xs",
  "2xs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
];

const NOT_YET_IMPLEMENTED = [
  "Select",
  "Checkbox",
  "Radio",
  "Accordion",
  "Modal",
  "Tabs",
  "Carousel",
  "Breadcrumb",
  "Alert",
  "Tooltip",
  "Badge",
];

function LabBlock({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="tw:flex tw:flex-col tw:gap-sm tw:mb-2xl">
      <div>
        <h2>{title}</h2>
        {description && (
          <p className="tw:text-copy-secondary tw:mt-3xs">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Laboratory: QA and validation surface for the token/component
 * system. This is NOT a template or a reference for art direction
 * (see MASTER-PROMPT.md §33); it exists so a broken token or
 * regressed component state is visible in one place.
 */
export default function Laboratory() {
  const { consent, clearConsent } = useCookieConsent();

  return (
    <Section>
      <Container>
        <p className="text-label text-muted">/laboratory</p>
        <h1 style={{ marginTop: "var(--space-sm)" }}>Component Laboratory</h1>
        <p className="text-body-large text-secondary" style={{ marginTop: "var(--space-sm)", marginBottom: "var(--space-3xl)" }}>
          Every token and primitive the Blueprint ships, in one place,
          for QA: not for copying its composition into a real page.
        </p>

        <LabBlock title="Color" description="Semantic roles: components consume these, never the raw neutral ramp.">
          <div className="grid-auto">
            {COLOR_SWATCHES.map(([name, token]) => (
              <div key={name} className="stack" style={{ gap: "var(--space-2xs)" }}>
                <div
                  style={{
                    height: "4rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: `var(${token})`,
                  }}
                />
                <span className="text-caption">{name}</span>
              </div>
            ))}
          </div>
        </LabBlock>

        <LabBlock title="Typography" description="Fluid scale: resize the viewport to confirm it scales without a media query.">
          <div className="stack">
            <p className="text-display">Display</p>
            <h1 style={{ margin: 0 }}>Heading 1</h1>
            <h2 style={{ margin: 0 }}>Heading 2</h2>
            <h3 style={{ margin: 0 }}>Heading 3</h3>
            <h4 style={{ margin: 0 }}>Heading 4</h4>
            <p className="text-body-large">Body large: for intros and lede paragraphs.</p>
            <p>Body: the default paragraph size.</p>
            <p className="text-body-small">Body small.</p>
            <p className="text-caption">Caption: muted, for metadata.</p>
            <p className="text-label">Label</p>
          </div>
        </LabBlock>

        <LabBlock title="Spacing" description="--space-3xs through --space-3xl.">
          <div className="stack" style={{ gap: "var(--space-2xs)" }}>
            {SPACING_TOKENS.map((token) => (
              <div key={token} className="cluster" style={{ gap: "var(--space-sm)" }}>
                <span className="text-caption" style={{ width: "3rem" }}>{token}</span>
                <div
                  style={{
                    height: "1rem",
                    width: `var(--space-${token})`,
                    backgroundColor: "var(--color-primary)",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
              </div>
            ))}
          </div>
        </LabBlock>

        <LabBlock title="Containers" description="standard / narrow / wide, all sharing the same gutter token.">
          <div className="stack" style={{ gap: "var(--space-xs)" }}>
            {(["narrow", "standard", "wide"] as const).map((variant) => (
              <Container
                key={variant}
                variant={variant === "standard" ? undefined : variant}
                style={{ backgroundColor: "var(--color-surface-alt)", padding: "var(--space-sm)" }}
              >
                <span className="text-caption">{variant}</span>
              </Container>
            ))}
          </div>
        </LabBlock>

        <LabBlock title="Buttons" description="primary / secondary / ghost, each with its interactive states.">
          <div className="cluster">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </LabBlock>

        <LabBlock title="Inputs" description="default / error / success / disabled.">
          <div className="grid-auto">
            <Input label="Default" placeholder="you@example.com" />
            <Input
              label="Error"
              defaultValue="not-an-email"
              status="error"
              message="Enter a valid email address."
            />
            <Input
              label="Success"
              defaultValue="you@example.com"
              status="success"
              message="Looks good."
            />
            <Input label="Disabled" placeholder="Disabled" disabled />
          </div>
        </LabBlock>

        <LabBlock title="Cards" description="static / interactive / selected / centered.">
          <div className="grid-auto">
            <Card>
              <h3 style={{ fontSize: "var(--font-size-h4)" }}>Static</h3>
              <p className="text-secondary">No interaction affordance.</p>
            </Card>
            <Card interactive>
              <h3 style={{ fontSize: "var(--font-size-h4)" }}>Interactive</h3>
              <p className="text-secondary">Hover / focus-visible for elevation.</p>
            </Card>
            <Card interactive selected>
              <h3 style={{ fontSize: "var(--font-size-h4)" }}>Selected</h3>
              <p className="text-secondary">Persistent selected state.</p>
            </Card>
            <Card center>
              <h3 style={{ fontSize: "var(--font-size-h4)" }}>Centered</h3>
              <p className="text-secondary">For stat/value-prop cards.</p>
            </Card>
          </div>
        </LabBlock>

        <LabBlock title="Global centering" description="Structural elements center by default; body prose and forms do not. See docs/design-system.md#global-centering.">
          <div
            className="section-intro"
            style={{
              padding: "var(--space-lg)",
              backgroundColor: "var(--color-surface-alt)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p className="text-label text-muted">.section-intro</p>
            <h3 style={{ margin: 0, fontSize: "var(--font-size-h3)" }}>
              Centered label, heading, and lede
            </h3>
            <p className="text-secondary">
              Capped at --measure-intro so it does not sprawl edge to edge.
            </p>
            <div className="cluster cluster--center">
              <Button size="sm">Primary action</Button>
              <Button size="sm" variant="secondary">
                Secondary
              </Button>
            </div>
          </div>
          <p
            className="text-secondary"
            style={{ marginTop: "var(--space-sm)", maxWidth: "60ch" }}
          >
            This paragraph, by contrast, stays left-aligned. Global
            centering applies to structural blocks, not to running body
            copy like this one.
          </p>
        </LabBlock>

        <LabBlock
          title="Cookie consent"
          description="Rendered globally in App.tsx; the banner shows automatically until a choice is made. See docs/design-system.md#cookieconsent."
        >
          <div className="stack" style={{ gap: "var(--space-2xs)" }}>
            <p className="text-secondary">
              Current consent: <strong>{consent ?? "not decided yet"}</strong>
            </p>
            <div className="cluster">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT))
                }
              >
                Open preferences
              </Button>
              <Button variant="ghost" size="sm" onClick={clearConsent}>
                Reset consent (re-show banner)
              </Button>
            </div>
          </div>
        </LabBlock>

        <LabBlock
          title="Back to top"
          description="Reuses useScrollState (the same hook Header uses) at a larger threshold. Scroll this page down to see it appear bottom-right; it hides while the cookie banner is open. See docs/design-system.md#backtotop."
        />

        <LabBlock
          title="Full-bleed split section"
          description="Shown here nested inside this page's Container for QA convenience: the real pattern places the media column outside any Container so it reaches the section edge. See docs/design-system.md#full-bleed-split-section for the full-bleed markup."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              minHeight: "16rem",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                placeItems: "center",
                backgroundColor: "var(--color-surface-alt)",
                border: "1px dashed var(--color-border-strong)",
              }}
            >
              <span className="text-caption text-muted">media placeholder</span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "var(--space-2xs)",
                padding: "var(--space-lg)",
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderLeft: "none",
              }}
            >
              <p className="text-label text-muted">Pattern demo</p>
              <h3 style={{ margin: 0 }}>Copy stays measure-capped</h3>
              <p className="text-secondary">
                The media column has zero padding and ignores the page
                gutter; the copy column keeps its own comfortable measure.
                That asymmetry is the whole pattern.
              </p>
            </div>
          </div>
        </LabBlock>

        <LabBlock title="Not yet implemented" description="Architecture and token contract exist in docs/design-system.md; components ship when a real use case needs them (§14/§36: no components built to pad the library).">
          <div className="cluster">
            {NOT_YET_IMPLEMENTED.map((name) => (
              <span
                key={name}
                className="text-caption"
                style={{
                  padding: "var(--space-3xs) var(--space-xs)",
                  border: "1px dashed var(--color-border-strong)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </LabBlock>
      </Container>
    </Section>
  );
}
