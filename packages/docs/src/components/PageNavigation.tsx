import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageLink {
  to: string;
  label: string;
}

interface PageNavigationProps {
  prev?: PageLink;
  next?: PageLink;
}

export function PageNavigation({ prev, next }: PageNavigationProps) {
  if (!prev && !next) return null;

  return (
    <nav className="page-navigation">
      {prev ? (
        <Link to={prev.to} className="page-nav-link page-nav-prev">
          <ChevronLeft size={20} />
          <div className="page-nav-content">
            <span className="page-nav-label">Previous</span>
            <span className="page-nav-title">{prev.label}</span>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link to={next.to} className="page-nav-link page-nav-next">
          <div className="page-nav-content">
            <span className="page-nav-label">Next</span>
            <span className="page-nav-title">{next.label}</span>
          </div>
          <ChevronRight size={20} />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}

export default PageNavigation;
