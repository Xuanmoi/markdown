import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import CartUml from "../cart-uml.canvas";
import PaymentUml from "../payment-uml.canvas";
import QuoteCheckoutUml from "../quote-checkout-uml.canvas";
import "./styles.css";

const pages = [
  { id: "cart", title: "购物车 UML", component: CartUml },
  { id: "quote-checkout", title: "Quote Checkout UML", component: QuoteCheckoutUml },
  { id: "payment", title: "支付 UML", component: PaymentUml },
] as const;

type PageId = (typeof pages)[number]["id"];

function readInitialPage(): PageId {
  const hash = window.location.hash.replace("#", "");
  return pages.some((page) => page.id === hash) ? (hash as PageId) : "cart";
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(readInitialPage);
  const ActivePage = useMemo(() => pages.find((page) => page.id === currentPage)?.component ?? CartUml, [currentPage]);

  function switchPage(pageId: PageId) {
    setCurrentPage(pageId);
    window.history.replaceState(null, "", `#${pageId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <div>
            <div className="site-title">Checkout UML Pages</div>
            <div className="site-subtitle">购物车、Quote Checkout、支付链路文档</div>
          </div>
          <nav className="site-tabs" aria-label="页面">
            {pages.map((page) => (
              <button
                key={page.id}
                className={page.id === currentPage ? "site-tab site-tab--active" : "site-tab"}
                type="button"
                onClick={() => switchPage(page.id)}
              >
                {page.title}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="site-main">
        <ActivePage />
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
