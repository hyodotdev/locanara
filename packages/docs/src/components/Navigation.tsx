import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { DarkModeToggle } from "./DarkModeToggle";
import { Menu, X } from "lucide-react";
import { FaGithub, FaSearch } from "react-icons/fa";
import { openSearchModal } from "../lib/signals";
import { LOGO_PATH } from "../lib/config";

function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearchModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/docs" className="logo">
          <img src={LOGO_PATH} alt="Locanara" className="logo-image" />
          <span className="logo-text">Locanara</span>
        </Link>

        {/* Desktop Menu */}
        <ul className="nav-menu desktop-menu">
          <li>
            <a href="/docs/introduction" className="nav-link">
              Docs
            </a>
          </li>

          <li>
            <NavLink
              to="/blog"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Blog
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/versions"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Versions
            </NavLink>
          </li>
        </ul>

        <div className="nav-actions">
          {/* Search Button */}
          <button
            type="button"
            className="search-button"
            onClick={() => openSearchModal()}
            aria-label="Search APIs (Cmd+K)"
            title="Search APIs (Cmd+K)"
          >
            <FaSearch size={18} />
          </button>

          <DarkModeToggle />

          {/* GitHub Link */}
          <a
            href="https://github.com/locanara"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="View on GitHub"
          >
            <FaGithub size={20} />
          </a>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
          <ul className="mobile-nav-list">
            <li>
              <a
                href="/docs/introduction"
                className="nav-link"
                onClick={closeMobileMenu}
              >
                Docs
              </a>
            </li>

            <li>
              <NavLink
                to="/blog"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeMobileMenu}
              >
                Blog
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/versions"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={closeMobileMenu}
              >
                Versions
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
