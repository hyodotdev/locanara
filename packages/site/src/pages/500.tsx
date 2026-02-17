import { SEO } from "../components/SEO";
import { Link } from "react-router-dom";
import { Home, RefreshCw } from "lucide-react";

interface ServerErrorProps {
  error?: Error;
  resetError?: () => void;
}

export function ServerError({ error, resetError }: ServerErrorProps) {
  const handleRefresh = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  return (
    <>
      <SEO
        title="Something Went Wrong"
        description="An unexpected error occurred."
        path="/500"
      />
      <div className="min-h-screen bg-background-primary dark:bg-background-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <span className="text-8xl font-bold text-accent">500</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-dark-primary mb-4">
            Something Went Wrong
          </h1>
          <p className="text-text-secondary dark:text-text-dark-secondary mb-4">
            An unexpected error occurred. We've been notified and are working to
            fix the issue.
          </p>
          {error && import.meta.env.DEV && (
            <pre className="text-left text-xs text-red-500 bg-red-500/10 p-4 rounded-lg mb-6 overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary/20 dark:border-white/20 text-text-primary dark:text-text-dark-primary rounded-lg hover:bg-primary/5 dark:hover:bg-white/5 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
