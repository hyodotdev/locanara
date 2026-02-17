import { Link, useLocation } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Menu, X, Github, Loader2, Search } from "lucide-react";
import { Button } from "./uis/Button";
import { Avatar } from "./uis/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { openSearchModal } from "../lib/signals";

const AUTH_PENDING_KEY = "auth_pending";

export function Navigation() {
  const { signIn } = useAuthActions();
  const user = useQuery(api.users.query.getCurrentUser);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  // Check if returning from OAuth redirect (show skeleton instead of sign in button)
  const isAuthPending = sessionStorage.getItem(AUTH_PENDING_KEY) === "true";

  // Clear pending state when user is actually logged in
  useEffect(() => {
    if (user) {
      sessionStorage.removeItem(AUTH_PENDING_KEY);
    }
  }, [user]);

  const handleSignIn = async () => {
    setIsButtonLoading(true);
    sessionStorage.setItem(AUTH_PENDING_KEY, "true");
    try {
      await signIn("github");
    } finally {
      // Reset state whether signIn succeeds without redirect or fails
      sessionStorage.removeItem(AUTH_PENDING_KEY);
      setIsButtonLoading(false);
    }
  };

  // Show loading state: initial load OR returning from OAuth redirect (but not when button was just clicked)
  const showLoadingSkeleton =
    user === undefined || (user === null && isAuthPending && !isButtonLoading);

  // Get avatar URL - prioritize profile avatarUrl (uploaded image) over auth image
  const avatarUrl =
    user?.profile?.avatarUrl ||
    user?.image ||
    (user?.name ? `https://github.com/${user.name}.png` : undefined);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/community", label: "Community" },
    { href: "/feature-requests", label: "Feature Requests" },
    { href: "/docs", label: "Docs" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 dark:border-white/10 bg-background-primary/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-lg"
          >
            <img src="/icon.webp" alt="Locanara" className="w-7 h-7" />
            <span className="text-accent">Locanara</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm transition-colors ${
                  isActive(link.href)
                    ? "text-text-primary dark:text-text-dark-primary font-medium"
                    : "text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={openSearchModal}
              className="p-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
              aria-label="Search (⌘K)"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>
            <a
              href="https://github.com/hyodotdev/locanara"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
              aria-label="GitHub Repository"
              title="View on GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <ThemeToggle />
            {showLoadingSkeleton ? (
              /* Loading auth state */
              <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Link to="/profile" className="flex items-center gap-2">
                  <Avatar src={avatarUrl} size="sm" />
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSignIn}
                disabled={isButtonLoading}
              >
                {isButtonLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Github className="w-4 h-4 mr-2" />
                )}
                {isButtonLoading ? "Signing in..." : "Sign In"}
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary/10 dark:border-white/10">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-2 py-2 text-sm ${
                    isActive(link.href)
                      ? "text-text-primary dark:text-text-dark-primary font-medium"
                      : "text-text-secondary dark:text-text-dark-secondary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 px-2 pt-2">
                <a
                  href="https://github.com/hyodotdev/locanara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
                  aria-label="GitHub Repository"
                >
                  <Github className="w-4 h-4" />
                </a>
                <ThemeToggle />
                {showLoadingSkeleton ? (
                  <div className="w-20 h-8 rounded bg-primary/10 dark:bg-white/10 animate-pulse" />
                ) : user ? (
                  <Link
                    to="/profile"
                    className="flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Avatar src={avatarUrl} size="sm" />
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSignIn}
                    disabled={isButtonLoading}
                  >
                    {isButtonLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Github className="w-4 h-4 mr-2" />
                    )}
                    {isButtonLoading ? "Signing in..." : "Sign In"}
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
