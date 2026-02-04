import { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import SEO from "../../components/SEO";
import { useScrollToHash } from "../../hooks/useScrollToHash";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  year: number;
}

const blogPosts: BlogPost[] = [
  {
    id: "locanara-1.0.0",
    title:
      "Locanara 1.0.0 - Unified on-device AI SDK for iOS, Android, and Web",
    date: "2026-01-10",
    year: 2026,
  },
];

// Group posts by year
const postsByYear = blogPosts.reduce(
  (acc, post) => {
    if (!acc[post.year]) {
      acc[post.year] = [];
    }
    acc[post.year].push(post);
    return acc;
  },
  {} as Record<number, BlogPost[]>,
);

const years = Object.keys(postsByYear)
  .map(Number)
  .sort((a, b) => b - a);

// Post content components
function Locanara100() {
  return (
    <>
      <p>
        We're excited to announce the first stable release of Locanara, a
        unified SDK that brings on-device AI capabilities to iOS, Android, and
        Web platforms through a single, consistent API.
      </p>

      <h2>Highlights</h2>
      <ul>
        <li>
          <strong>Unified API across platforms</strong> - Write once, run
          anywhere with identical method signatures for iOS (Swift), Android
          (Kotlin), and Web (TypeScript)
        </li>
        <li>
          <strong>Privacy-first architecture</strong> - All AI processing
          happens entirely on-device. No data ever leaves the user's device.
        </li>
        <li>
          <strong>Native performance</strong> - Direct integration with Apple
          Intelligence, Gemini Nano, and Chrome Built-in AI for optimal
          performance
        </li>
      </ul>

      <h2>Supported Platforms</h2>
      <ul>
        <li>
          <strong>iOS/macOS</strong> - Apple Intelligence via Foundation Models
          framework (iOS 26+, macOS 26+)
        </li>
        <li>
          <strong>Android</strong> - Gemini Nano via ML Kit GenAI (Android 14+)
        </li>
        <li>
          <strong>Web</strong> - Chrome Built-in AI APIs (Chrome 138+)
        </li>
      </ul>

      <h2>Available APIs</h2>
      <p>
        Locanara 1.0.0 provides the following AI capabilities across all
        supported platforms:
      </p>
      <ul>
        <li>
          <Link to="/docs/apis/get-device-capability">
            <code>getDeviceCapability()</code>
          </Link>{" "}
          - Check device AI support
        </li>
        <li>
          <Link to="/docs/apis/summarize">
            <code>summarize()</code>
          </Link>{" "}
          - Text summarization
        </li>
        <li>
          <Link to="/docs/apis/classify">
            <code>classify()</code>
          </Link>{" "}
          - Text classification
        </li>
        <li>
          <Link to="/docs/apis/extract">
            <code>extract()</code>
          </Link>{" "}
          - Entity extraction
        </li>
        <li>
          <Link to="/docs/apis/chat">
            <code>chat()</code>
          </Link>{" "}
          - Conversational AI
        </li>
        <li>
          <Link to="/docs/apis/translate">
            <code>translate()</code>
          </Link>{" "}
          - Language translation
        </li>
        <li>
          <Link to="/docs/apis/rewrite">
            <code>rewrite()</code>
          </Link>{" "}
          - Text rewriting with different tones
        </li>
        <li>
          <Link to="/docs/apis/proofread">
            <code>proofread()</code>
          </Link>{" "}
          - Grammar and spelling correction
        </li>
        <li>
          <Link to="/docs/apis/describe-image">
            <code>describeImage()</code>
          </Link>{" "}
          - Image description generation
        </li>
      </ul>

      <h2>Getting Started</h2>
      <p>
        Check out our setup guides to get started with Locanara on your
        platform:
      </p>
      <ul>
        <li>
          <Link to="/docs/ios-setup">iOS Setup Guide</Link>
        </li>
        <li>
          <Link to="/docs/android-setup">Android Setup Guide</Link>
        </li>
        <li>
          <Link to="/docs/web-setup">Web Setup Guide</Link>
        </li>
      </ul>

      <h2>What's Next</h2>
      <p>
        We're actively working on expanding Locanara's capabilities. Stay tuned
        for updates on new features, additional platform support, and community
        contributions.
      </p>
    </>
  );
}

const postContents: Record<string, React.ReactNode> = {
  "locanara-1.0.0": <Locanara100 />,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogIndex() {
  useScrollToHash();
  const firstPost = blogPosts[0];

  return (
    <div className="blog-post">
      <SEO
        title="Blog"
        description="Announcements and release notes for Locanara SDK."
        path="/blog"
      />
      <h1>{firstPost.title}</h1>
      <p className="blog-post-date">{formatDate(firstPost.date)}</p>
      <div className="blog-post-content">{postContents[firstPost.id]}</div>
    </div>
  );
}

function PostDetail({ posts }: { posts: BlogPost[] }) {
  useScrollToHash();
  const location = useLocation();
  const postId = location.pathname.split("/blog/")[1];

  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const content = postContents[post.id];

  return (
    <div className="blog-post">
      <SEO
        title={post.title}
        description={`${post.title} - Locanara SDK release announcement`}
        path={`/blog/${post.id}`}
      />
      <h1>{post.title}</h1>
      <p className="blog-post-date">{formatDate(post.date)}</p>
      <div className="blog-post-content">{content}</div>
    </div>
  );
}

function Blog() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="blog-container">
      <button
        className={`blog-sidebar-toggle ${isSidebarOpen ? "hidden" : ""} ${isScrolled ? "scrolled" : ""}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Menu</span>
      </button>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <aside className={`blog-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <nav className="blog-nav">
          <h3>Blog</h3>
          {years.map((year) => (
            <div key={year} className="blog-year-section">
              <h4>{year}</h4>
              <ul>
                {postsByYear[year].map((post) => (
                  <li key={post.id}>
                    <NavLink
                      to={`/blog/${post.id}`}
                      className={({ isActive }) => (isActive ? "active" : "")}
                      onClick={closeSidebar}
                    >
                      {post.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="blog-content">
        <Routes>
          <Route index element={<BlogIndex />} />
          <Route path=":postId" element={<PostDetail posts={blogPosts} />} />
        </Routes>
      </main>
    </div>
  );
}

export default Blog;
