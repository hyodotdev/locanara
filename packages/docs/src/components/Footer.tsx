import { LOGO_PATH } from "../lib/config";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={LOGO_PATH} alt="Locanara" className="footer-logo" />
            <div>
              <h3>Locanara</h3>
              <p>Unified On-Device AI SDK</p>
            </div>
          </div>
          <div className="footer-links">
            <div className="footer-section">
              <h4>Documentation</h4>
              <ul>
                <li>
                  <a href="/docs/apis">APIs</a>
                </li>
                <li>
                  <a href="/docs/types">Types</a>
                </li>
                <li>
                  <a href="/docs/apis/ios">iOS SDK</a>
                </li>
                <li>
                  <a href="/docs/apis/android">Android SDK</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Resources</h4>
              <ul>
                <li>
                  <a href="/introduction">Introduction</a>
                </li>
                <li>
                  <a href="/docs/ios-setup">iOS Setup</a>
                </li>
                <li>
                  <a href="/docs/android-setup">Android Setup</a>
                </li>
                <li>
                  <a href="/docs/example">Examples</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Community</h4>
              <ul>
                <li>
                  <a
                    href="https://github.com/locanara"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="http://hyo.dev/joinSlack"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Slack
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/locanara"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a href="mailto:hyo@hyo.dev">Contact</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p>
            &copy; 2025{" "}
            <a
              href="https://hyo.dev"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "inherit",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Hyo Dev
            </a>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
