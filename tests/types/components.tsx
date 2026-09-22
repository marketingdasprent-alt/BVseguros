// Compile-only contracts: checked by tsc, never included in the application.
import Button from "../../src/components/ui/Button";
import Card from "../../src/components/ui/Card";
import Container from "../../src/components/layout/Container";
import Section from "../../src/components/layout/Section";
import Input from "../../src/components/forms/Input";
import Link from "../../src/app/Link";

export const validContracts = [
  <Button key="button" onClick={(event) => event.currentTarget.disabled}>Save</Button>,
  <Button key="link" as={Link} href="/laboratory">Lab</Button>,
  <Button key="anchor" as="a" href="/" target="_blank">Home</Button>,
  <Container key="container" as="article" variant="wide" aria-label="Article" />,
  <Section key="section" surface variant="compact" />,
  <Card key="card" as="a" href="/" />,
  <Input key="input" status="error" onChange={(event) => event.currentTarget.value} />,
];

// @ts-expect-error: Unsupported button variant must not be accepted.
export const invalidVariant = <Button variant="unknown" />;
// @ts-expect-error: A native button does not accept href without changing as.
export const invalidButtonHref = <Button href="/" />;
// @ts-expect-error: A native div does not accept href.
export const invalidContainerHref = <Container href="/" />;
// @ts-expect-error: Status is restricted to the implemented states.
export const invalidInputStatus = <Input status="warning" />;
// @ts-expect-error: Only documented section variants are supported.
export const invalidSectionVariant = <Section variant="huge" />;
