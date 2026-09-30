import type { ComponentType } from "react";
import Header from "./components/navigation/Header";
import Footer from "./components/layout/Footer";
import CookieConsent from "./components/feedback/CookieConsent";
import ModalProposta from "./components/feedback/ModalProposta";
import { abrirProposta } from "./app/proposta";
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
import { usePathname, useScrollToHashOnNavigate } from "./app/router";
import { seguroPorCaminho } from "./data/seguros";

const ROUTES: Partial<Record<string, ComponentType>> = {
  "/": Home,
  "/seguros": Seguros,
  "/sinistros": Sinistros,
  "/laboratory": Laboratory,
  "/privacy": Privacy,
  "/terms": Terms,
  "/cookies": Cookies,
};

export default function App() {
  const pathname = usePathname();
  useScrollToHashOnNavigate(pathname);
  const Page = ROUTES[pathname.replace(/(.)\/+$/, "$1")] ?? NotFound;
  const seguro = seguroPorCaminho(pathname);

  return (
    <>
      <a href="#main-content" className="skip-link">
        Saltar para o conteúdo
      </a>
      {/* Na página de um ramo, o pop-up abre já com o formulário desse ramo. */}
      <Header cta={{ label: "Pedir contacto", onClick: () => abrirProposta(seguro?.key ?? null) }} />
      <main id="main-content">
        {seguro ? <SeguroPagina key={seguro.slug} seguro={seguro} /> : <Page />}
      </main>
      <Footer />
      <BackToTop />
      <ModalProposta />
      <CookieConsent />
    </>
  );
}
