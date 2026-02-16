import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-primary/10 dark:border-white/10 bg-background-secondary dark:bg-background-dark-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <img src="/icon.webp" alt="Locanara" className="w-6 h-6" />
              <span className="font-semibold text-lg text-accent">
                Locanara
              </span>
            </Link>
            <p className="mt-2 text-sm text-text-secondary dark:text-text-dark-secondary max-w-xs">
              Free and open-source on-device AI SDK for iOS and Android.
              Privacy-first, unified API across platforms.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-medium text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/docs"
                  className="text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/hyodotdev/locanara"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-primary/10 dark:border-white/10">
          <p className="text-xs text-text-secondary dark:text-text-dark-secondary text-center">
            &copy; {new Date().getFullYear()} Locanara. Open-source under
            AGPL-3.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
