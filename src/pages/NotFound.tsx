import Container from "../components/layout/Container";
import Section from "../components/layout/Section";
import Button from "../components/ui/Button";
import Link from "../app/Link";

/**
 * Catch-all for any pathname App.tsx's ROUTES table doesn't
 * recognize. See docs/design-system.md#global-centering: this is a
 * standalone block, so it centers by default like a section-intro.
 */
export default function NotFound() {
  return (
    <Section variant="spacious">
      <Container variant="narrow">
        <div className="section-intro">
          <p className="text-label text-muted">Erro 404</p>
          <p className="text-display" style={{ color: "var(--color-primary)" }}>
            404
          </p>
          <h1>Página não encontrada.</h1>
          <p className="text-body-large text-secondary">
            O link que seguiu pode estar errado, ou a página já não existe.
            Volte à página inicial ou fale connosco se precisar de ajuda.
          </p>
          <div className="cluster cluster--center" style={{ marginTop: "var(--space-sm)" }}>
            <Button as={Link} href="/">
              Voltar ao início
            </Button>
            <Button as={Link} href="/#contacto" variant="secondary">
              Falar connosco
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
