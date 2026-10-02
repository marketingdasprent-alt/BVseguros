import type { ComponentType } from "react";
import Header from "./components/navigation/Header";
import Footer from "./components/layout/Footer";
import CookieConsent from "./components/feedback/CookieConsent";
import { hrefProposta, pedidoPorCaminho } from "./app/proposta";
import BackToTop from "./components/feedback/BackToTop";
import Home from "./pages/Home";
import Seguros from "./pages/Seguros";
import SeguroPagina from "./pages/SeguroPagina";
import Sinistros from "./pages/Sinistros";
import Laboratory from "./pages/Laboratory";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Cookies from "./pages/legal/Cookies";
import NotFound from "./pages/NotFound";
import PaginaPedido from "./pages/PaginaPedido";
import { usePathname, useScrollToHashOnNavigate } from "./app/router";
import { seguroPorCaminho } from "./data/seguros";

const ROUTES: Partial<Record<string, ComponentType>> = {
  "/": Home,
  "/seguros": Seguros,
  "/sinistros": Sinistros,
  // Página de QA do design system: só em `npm run dev`, nunca no site publicado.
  ...(import.meta.env.DEV ? { "/laboratory": Laboratory } : {}),
  "/privacy": Privacy,
  "/terms": Terms,
  "/cookies": Cookies,
};

export default function App() {
  const pathname = usePathname();
  useScrollToHashOnNavigate(pathname);
  const Page = ROUTES[pathname.replace(/(.)\/+$/, "$1")] ?? NotFound;
  const seguro = seguroPorCaminho(pathname);
  const pedido = pedidoPorCaminho(pathname);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Saltar para o conteúdo
      </a>
      {/* No pedido, a página é do formulário: barra mínima própria, sem o menu do site (como a Fidelidade). */}
      {!pedido && <Header cta={{ label: "Pedir proposta", href: hrefProposta(seguro?.key ?? null) }} />}
      <main id="main-content">
        {pedido ? (
          <PaginaPedido key={pathname} modo={pedido.modo} seguro={pedido.seguro} />
        ) : seguro ? (
          <SeguroPagina key={seguro.slug} seguro={seguro} />
        ) : (
          <Page />
        )}
      </main>
      <Footer minimo={Boolean(pedido)} />
      <BackToTop />
      <CookieConsent />
    </>
  );
}
