import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import SearchModal from "./components/SearchModal";
import Docs from "./pages/docs";
import Blog from "./pages/blog";
import Versions from "./pages/versions";
import NotFound from "./pages/404";
import { searchModalSignal, closeSearchModal } from "./lib/signals";
import { effect } from "@preact/signals-react";

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(searchModalSignal.value);

  useEffect(() => {
    // Subscribe to signal changes
    const unsubscribe = effect(() => {
      setIsSearchOpen(searchModalSignal.value);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/docs" replace />} />
          <Route path="docs/*" element={<Docs />} />
          <Route path="blog/*" element={<Blog />} />
          <Route path="versions" element={<Versions />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <SearchModal isOpen={isSearchOpen} onClose={closeSearchModal} />
      <ToastContainer
        position="bottom-center"
        toastStyle={{
          borderRadius: "0.75rem",
          backgroundColor: "var(--bg-secondary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          maxWidth: "28rem",
          width: "min(90vw, 28rem)",
        }}
        closeButton={false}
        newestOnTop
        pauseOnFocusLoss
      />
    </>
  );
}

export default App;
