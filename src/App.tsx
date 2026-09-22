import type { ComponentType } from "react";
import Header from "./components/navigation/Header";
import Footer from "./components/layout/Footer";
import CookieConsent from "./components/feedback/CookieConsent";
import BackToTop from "./components/feedback/BackToTop";
import Home from "./pages/Home";
import Laboratory from "./pages/Laboratory";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Cookies from "./pages/legal/Cookies";
import NotFound from "./pages/NotFound";
import { usePathname } from "./app/router";

const ROUTES: Partial<Record<string, ComponentType>> = {
  "/": Home,
  "/laboratory": Laboratory,
  "/privacy": Privacy,
  "/terms": Terms,
  "/cookies": Cookies,
};

export default function App() {
  const pathname = usePathname();
  const Page = ROUTES[pathname] ?? NotFound;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Saltar para o conteúdo
      </a>
      <Header cta={{ label: "Pedir contacto", href: "#contacto" }} />
      <main id="main-content">
        <Page />
      </main>
      <Footer />
      <BackToTop />
      <CookieConsent />
    </>
  );
}
