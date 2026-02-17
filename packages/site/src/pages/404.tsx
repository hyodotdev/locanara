import { SEO } from "../components/SEO";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export function NotFound() {
  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        path="/404"
      />
      <div className="min-h-screen bg-background-primary dark:bg-background-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <span className="text-8xl font-bold text-accent">404</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary mb-4">
            Page Not Found
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary/20 dark:border-white/20 text-text-primary dark:text-text-dark-primary rounded-lg hover:bg-primary/5 dark:hover:bg-white/5 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
