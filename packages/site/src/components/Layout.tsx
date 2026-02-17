import { Outlet, useLocation } from "react-router-dom";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

export function Layout() {
  const location = useLocation();

  // Show footer on home page and blog/versions pages, but not on docs or community
  const isDocsPage = location.pathname.startsWith("/docs");
  const showFooter =
    location.pathname === "/" ||
    (!isDocsPage && !location.pathname.startsWith("/community"));

  return (
    <div className="min-h-screen flex flex-col bg-background-primary dark:bg-background-dark">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
