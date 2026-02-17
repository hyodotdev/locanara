import { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageLoader } from "./components/PageLoader";
import { ScrollToTop } from "./components/ScrollToTop";
import SearchModal from "./components/docs/SearchModal";
import { searchModalSignal, closeSearchModal } from "./lib/signals";
import { effect } from "@preact/signals-react";

// Eager load home page for fast initial render
import { Home } from "./pages/home/Home";

// Lazy load main site pages
const Community = lazy(() =>
  import("./pages/community/Community").then((m) => ({ default: m.Community }))
);
const PostDetail = lazy(() =>
  import("./pages/post/PostDetail").then((m) => ({ default: m.PostDetail }))
);
const Profile = lazy(() =>
  import("./pages/profile/Profile").then((m) => ({ default: m.Profile }))
);
const PublicProfile = lazy(() =>
  import("./pages/profile/PublicProfile").then((m) => ({
    default: m.PublicProfile,
  }))
);
const Notifications = lazy(() =>
  import("./pages/notifications/Notifications").then((m) => ({
    default: m.Notifications,
  }))
);
const FeatureRequests = lazy(() =>
  import("./pages/feature-requests/FeatureRequests").then((m) => ({
    default: m.FeatureRequests,
  }))
);
const TermsOfService = lazy(() =>
  import("./pages/TermsOfService").then((m) => ({ default: m.TermsOfService }))
);
const PrivacyPolicy = lazy(() =>
  import("./pages/PrivacyPolicy").then((m) => ({ default: m.PrivacyPolicy }))
);
const NotFound = lazy(() =>
  import("./pages/404").then((m) => ({ default: m.NotFound }))
);

// Lazy load docs pages
const Docs = lazy(() => import("./pages/docs"));
const Blog = lazy(() => import("./pages/blog"));
const Versions = lazy(() => import("./pages/versions"));

export default function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(searchModalSignal.value);

  useEffect(() => {
    const unsubscribe = effect(() => {
      setIsSearchOpen(searchModalSignal.value);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="community" element={<Community />} />
              <Route path="community/post/:postId" element={<PostDetail />} />
              <Route path="feature-requests" element={<FeatureRequests />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:username" element={<PublicProfile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="docs/*" element={<Docs />} />
              <Route path="blog/*" element={<Blog />} />
              <Route path="versions" element={<Versions />} />
            </Route>
            <Route path="terms-of-service" element={<TermsOfService />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <SearchModal isOpen={isSearchOpen} onClose={closeSearchModal} />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
